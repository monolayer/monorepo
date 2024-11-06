import color from "picocolors";

export const logGray = (msg: string) => {
	console.log(color.gray(msg));
};

export const logEmpty = () => console.log("");
