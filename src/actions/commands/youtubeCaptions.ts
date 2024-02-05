import { App } from "obsidian";
import { AugmentedCanvasSettings } from "src/settings/AugmentedCanvasSettings";
import { getYouTubeVideoId } from "src/utils";

import { google } from "googleapis";

async function getVideoSubtitles(
	settings: AugmentedCanvasSettings,
	videoId: string
): Promise<string[]> {
	// // TODO Convert to Oauth
	// const youtube = google.youtube({
	// 	version: "v3",
	// 	auth: settings.youtubeApiKey, // Replace with your API key
	// });
	// try {
	// 	const response = await youtube.captions.list({
	// 		part: ["snippet"],
	// 		videoId: videoId,
	// 	});
	// 	console.log({ response });
	// 	const items = response.data.items;
	// 	if (items) {
	// 		const subtitles = [];
	// 		for await (const caption of items) {
	// 			console.log({ caption });
	// 			try {
	// 				const response = await youtube.captions.download(
	// 					{
	// 						id: caption.id!,
	// 						tfmt: "ttml", // This specifies the format of the captions file. Options are 'ttml' or 'vtt' for example.
	// 					},
	// 					{
	// 						responseType: "text",
	// 					}
	// 				);
	// 				// The caption content will be in the response body as a string
	// 				subtitles.push(response.data as string);
	// 			} catch (error) {
	// 				console.error("Error downloading caption:", error);
	// 			}
	// 		}
	// 		return subtitles;
	// 	}
	// 	return [];
	// } catch (error) {
	// 	console.error("Error fetching video captions:", error);
	// 	return [];
	// }
}

export const runYoutubeCaptions = async (
	app: App,
	settings: AugmentedCanvasSettings,
	videoUrl: string
) => {
	// const videoId = getYouTubeVideoId(videoUrl);
	// console.log({ videoId });
	// if (!videoId) return;
	// const subtitles = await getVideoSubtitles(settings, videoId);
	// console.log({ subtitles });
};
