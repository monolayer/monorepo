import { writeFileSync } from "fs";
import ora from "ora";
import path from "path";

export function addBroadcastWorkload() {
	const template = broadcastWorkload();
	const spinner = ora();
	spinner.start(`Create broadcast workload in ./workloads/broadcast.ts`);
	writeFileSync(path.join("workloads", `broadcast.ts`), template);
	spinner.succeed();
}

function broadcastWorkload() {
	return `import { Broadcast, ChannelData } from "@monolayer/sdk";

export type SampleChannelData = { message: string };
export type RoomChannelData = { message: string };

const broadcast = new Broadcast({
	channels: {
		"sample": {
			data: new ChannelData<SampleChannelData>(),
		},
		"/room/:id": {
			data: new ChannelData<RoomChannelData>(),
		},
	},
});

export default broadcast;
export type Channels = typeof broadcast._channelDataType;
`;
}
