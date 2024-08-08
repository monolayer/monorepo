import { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	Changeset,
	ChangesetPhase,
	MigrationOpPriority,
} from "~/changeset/types.js";
import { ChangeWarningCode } from "~/changeset/warnings/codes.js";
import { ChangeWarningType } from "~/changeset/warnings/types.js";
import { currentTableName } from "~/introspection/table-name.js";
import { executeKyselySchemaStatement } from "../../../../../changeset/helpers.js";

export function columnDataTypeMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isColumnDataType(diff)) {
		return columnDatatypeMigrationOperation(diff, context);
	}
}

type ColumnDataTypeDifference = {
	type: "CHANGE";
	path: ["table", string, "columns", string, "dataType"];
	value: string | null;
	oldValue: string | null;
};

function isColumnDataType(test: Difference): test is ColumnDataTypeDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 5 &&
		test.path[2] === "columns" &&
		test.path[4] === "dataType"
	);
}

function columnDatatypeMigrationOperation(
	diff: ColumnDataTypeDifference,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];
	const newDataType = `sql\`${diff.value}\``;
	const oldDataType = `sql\`${diff.oldValue}\``;

	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDatatype,
		phase: ChangesetPhase.Alter,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.ChangeColumnDataType,
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.setDataType(${newDataType}))`,
			),
		],
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.setDataType(${oldDataType}))`,
			),
		],
		schemaName,
	};
	if (!safeDataTypeChange(diff.oldValue!, diff.value!)) {
		changeset.warnings = [
			{
				type: ChangeWarningType.Blocking,
				code: ChangeWarningCode.ChangeColumnType,
				schema: schemaName,
				table: tableName,
				column: columnName,
				from: diff.oldValue!,
				to: diff.value!,
			},
		];
	}
	return changeset;
}

export function safeDataTypeChange(oldDataType: string, newDataType: string) {
	const safeTypes = [
		"bit varying",
		"character varying",
		"numeric",
		"cidr",
		"time",
		"timestamp",
	];
	if (!safeTypes.some((type) => oldDataType.includes(type))) return false;

	const safeConversions: Record<string, boolean> = {
		"character varying:text": true,
		"cidr:inet": true,
		"timestamp:timestamp with time zone": true,
		"timestamp with time zone:timestamp": true,
	};

	if (safeConversions[`${oldDataType}:${newDataType}`]) return true;

	if (
		oldDataType.includes("character varying") &&
		newDataType.includes("character varying")
	) {
		return increasedLimitOnCharacterVarying(oldDataType, newDataType);
	}

	if (oldDataType.includes("numeric") && newDataType.includes("numeric")) {
		return (
			removedPrecisionAndScaleOnNumeric(oldDataType, newDataType) ||
			increasedPrecisionWithSameScaleOnNumeric(oldDataType, newDataType)
		);
	}
	if (oldDataType.match(/^(time|time\((\d+)\))$/)) {
		return (
			removedPrecisionOnTime(oldDataType, newDataType) ||
			increasedPrecisionOnTime(oldDataType, newDataType)
		);
	}
	if (
		oldDataType.match(/^(time\((\d+)\) with time zone|time with time zone)$/)
	) {
		return (
			removedPrecisionOnTimeWithTimeZone(oldDataType, newDataType) ||
			increasedPrecisionOnTimeWithTimeZone(oldDataType, newDataType)
		);
	}
	if (oldDataType.match(/^(timestamp|timestamp\((\d+)\))$/)) {
		return (
			removedPrecisionFromTimeStamp(oldDataType, newDataType) ||
			increasedPrecisionOnTimeStamp(oldDataType, newDataType)
		);
	}
	if (
		oldDataType.match(
			/^(timestamp\((\d+)\) with time zone|timestamp with time zone)$/,
		)
	) {
		return (
			removedPrecisionFromTimestampWithTimeZone(oldDataType, newDataType) ||
			increasedPrecisionOnTimestampWithTimeZone(oldDataType, newDataType)
		);
	}
	if (oldDataType.match(/^bit varying\((\d+)\)$/)) {
		return (
			removeLengthOnBitVarying(oldDataType, newDataType) ||
			increasedMaximumLengthOnBitVarying(oldDataType, newDataType)
		);
	}
	return false;
}

function increasedLimitOnCharacterVarying(oldValue: string, newValue: string) {
	const oldMaximumLengthMatch = oldValue.match(/character varying\((\d+)\)/);
	const newMaximumLengthMatch = newValue.match(/character varying\((\d+)\)/);

	if (oldMaximumLengthMatch && newMaximumLengthMatch) {
		const oldMaximumLength = parseInt(String(oldMaximumLengthMatch[1]));
		const newMaximumLength = parseInt(String(newMaximumLengthMatch[1]));

		if (newMaximumLength > oldMaximumLength) return true;
	}
	return false;
}

function removedPrecisionAndScaleOnNumeric(oldValue: string, newValue: string) {
	const oldNumericMatch = oldValue.match(/numeric\((\d+), (\d+)\)/);
	const newNumericMatch = newValue.match(/numeric$/);

	if (oldNumericMatch && newNumericMatch) return true;

	return false;
}

function increasedPrecisionWithSameScaleOnNumeric(
	oldValue: string,
	newValue: string,
) {
	const oldNumericMatch = oldValue.match(/numeric\((\d+), (\d+)\)/);
	const newNumericMatch = newValue.match(/numeric\((\d+), (\d+)\)/);
	if (!oldNumericMatch || !newNumericMatch) return false;

	const [, oldPrecision, oldScale] = oldNumericMatch;
	const [, newPrecision, newScale] = newNumericMatch;

	if (oldScale !== newScale) return false;

	if (parseInt(String(newPrecision)) < parseInt(String(oldPrecision)))
		return false;

	return true;
}
function removedPrecisionOnTime(oldValue: string, newValue: string) {
	const oldTimeMatch = oldValue.match(/^time\((\d+)\)$/);
	const newTimeMatch = newValue.match(/^time$/);

	if (oldTimeMatch && newTimeMatch) return true;

	return false;
}

function increasedPrecisionOnTime(oldValue: string, newValue: string) {
	const oldTimeMatch = oldValue.match(/^time\((\d+)\)$/);
	const newTimeMatch = newValue.match(/^time\((\d+)\)$/);

	if (oldTimeMatch && newTimeMatch) {
		const [, oldPrecision] = oldTimeMatch;
		const [, newPrecision] = newTimeMatch;

		if (parseInt(String(newPrecision)) > parseInt(String(oldPrecision)))
			return true;
	}

	return false;
}

function removedPrecisionOnTimeWithTimeZone(
	oldValue: string,
	newValue: string,
) {
	const oldTimeMatch = oldValue.match(/^time\((\d+)\) with time zone$/);
	const newTimeMatch = newValue.match(/^time with time zone$/);

	if (oldTimeMatch && newTimeMatch) return true;

	return false;
}

function increasedPrecisionOnTimeWithTimeZone(
	oldValue: string,
	newValue: string,
) {
	const oldTimeMatch = oldValue.match(/time\((\d+)\) with time zone/);
	const newTimeMatch = newValue.match(/time\((\d+)\) with time zone/);

	if (oldTimeMatch && newTimeMatch) {
		const [, oldPrecision] = oldTimeMatch;
		const [, newPrecision] = newTimeMatch;

		if (parseInt(String(newPrecision)) > parseInt(String(oldPrecision)))
			return true;
	}

	return false;
}

function removedPrecisionFromTimeStamp(oldValue: string, newValue: string) {
	const oldTimeStampMatch = oldValue.match(/timestamp\((\d+)\)/);
	const newTimeStampMatch = newValue.match(/timestamp$/);

	if (oldTimeStampMatch && newTimeStampMatch) return true;

	return false;
}

function increasedPrecisionOnTimeStamp(oldValue: string, newValue: string) {
	const oldTimeStampMatch = oldValue.match(/timestamp\((\d+)\)/);
	const newTimeStampMatch = newValue.match(/timestamp\((\d+)\)/);

	if (oldTimeStampMatch && newTimeStampMatch) {
		const [, oldPrecision] = oldTimeStampMatch;
		const [, newPrecision] = newTimeStampMatch;

		if (parseInt(String(newPrecision)) > parseInt(String(oldPrecision)))
			return true;
	}

	return false;
}

function removedPrecisionFromTimestampWithTimeZone(
	oldValue: string,
	newValue: string,
) {
	const oldTimeStampMatch = oldValue.match(/timestamp\((\d+)\) with time zone/);
	const newTimeStampMatch = newValue.match(/timestamp with time zone$/);

	if (oldTimeStampMatch && newTimeStampMatch) return true;

	return false;
}

function increasedPrecisionOnTimestampWithTimeZone(
	oldValue: string,
	newValue: string,
) {
	const oldTimeStampMatch = oldValue.match(/timestamp\((\d+)\) with time zone/);
	const newTimeStampMatch = newValue.match(/timestamp\((\d+)\) with time zone/);

	if (oldTimeStampMatch && newTimeStampMatch) {
		const [, oldPrecision] = oldTimeStampMatch;
		const [, newPrecision] = newTimeStampMatch;

		if (parseInt(String(newPrecision)) > parseInt(String(oldPrecision)))
			return true;
	}

	return false;
}

function removeLengthOnBitVarying(oldValue: string, newValue: string) {
	const oldBitVaryingMatch = oldValue.match(/bit varying\((\d+)\)/);
	const newBitVaryingMatch = newValue.match(/bit varying/);

	if (oldBitVaryingMatch && newBitVaryingMatch) return true;

	return false;
}

function increasedMaximumLengthOnBitVarying(
	oldValue: string,
	newValue: string,
) {
	const oldBitVaryingMatch = oldValue.match(/bit varying\((\d+)\)/);
	const newBitVaryingMatch = newValue.match(/bit varying\((\d+)\)/);

	if (oldBitVaryingMatch && newBitVaryingMatch) {
		const [, oldLength] = oldBitVaryingMatch;
		const [, newLength] = newBitVaryingMatch;

		if (parseInt(String(newLength)) > parseInt(String(oldLength))) return true;
	}

	return false;
}
