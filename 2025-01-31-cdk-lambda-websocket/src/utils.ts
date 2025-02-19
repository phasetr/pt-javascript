export function nowJst(): string {
	const now = new Date();
	return now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}
