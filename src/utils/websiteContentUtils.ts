export const getWebsiteContent = async (url: string) => {
	// // console.log({ getWebsiteContent2: true })
	// const content = await fetch(url, {
	// 	// mode: "no-cors",
	// });
	// console.log({ content, body: content.body });
	// return {};
	// const getMDForTagName = (tagName: string) => {
	// 	if (tagName === "h1") {
	// 		return "#";
	// 	} else if (tagName === "h2") {
	// 		return "##";
	// 	} else if (tagName === "h3") {
	// 		return "###";
	// 	} else if (tagName === "h4") {
	// 		return "####";
	// 	} else if (tagName === "h5") {
	// 		return "#####";
	// 	} else if (tagName === "h6") {
	// 		return "######";
	// 	}
	// };
	// // let count = 0;
	// let textContent = "";
	// // const selectors = [];
	// // function fullPath(el) {
	// // 	var names = [];
	// // 	while (el.parentNode) {
	// // 		if (el.id) {
	// // 			names.unshift("#" + el.id);
	// // 			break;
	// // 		} else {
	// // 			if (el == el.ownerDocument.documentElement)
	// // 				names.unshift(el.tagName);
	// // 			else {
	// // 				for (
	// // 					var c = 1, e = el;
	// // 					e.previousElementSibling;
	// // 					e = e.previousElementSibling, c++
	// // 				);
	// // 				names.unshift(el.tagName + ":nth-child(" + c + ")");
	// // 			}
	// // 			el = el.parentNode;
	// // 		}
	// // 	}
	// // 	return names.join(" > ");
	// // }
	// // Function to traverse all elements in the DOM
	// function traverseDOM(element: Element): void {
	// 	// Process the current element
	// 	// console.log(element.tagName);
	// 	const includedTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6"];
	// 	// const excludedTags = ["script", "button"]
	// 	if (
	// 		includedTags.includes(element.tagName.toLowerCase())
	// 		// &&
	// 		// element.textContent.split(" ").length > 5
	// 	) {
	// 		const text = element.textContent
	// 			?.replace(/\n/g, " ")
	// 			.replace(/\\n/g, "")
	// 			.replace(/\t/g, "")
	// 			.replace(/\\t/g, "")
	// 			.trim();
	// 		// console.log({ text, tagName: element.tagName })
	// 		// * Example: 1. ### Title
	// 		textContent +=
	// 			"\n\n" +
	// 			// `${count}.` +
	// 			(element.tagName.toLowerCase() !== "p"
	// 				? getMDForTagName(element.tagName.toLowerCase()) + " "
	// 				: "") +
	// 			text;
	// 		// count++;
	// 		// const path = fullPath(element);
	// 		// selectors.push(path);
	// 		// document.querySelector(path).scrollIntoView()
	// 	}
	// 	// Recursively traverse child elements
	// 	Array.from(element.children).forEach((child) => {
	// 		traverseDOM(child);
	// 	});
	// }
	// // Example usage
	// // document.addEventListener('DOMContentLoaded', () => {
	// traverseDOM(document.documentElement);
	// // });
	// console.log({
	// 	// selectors,
	// 	textContent,
	// });
	// return {
	// 	textContent,
	// 	// selectors,
	// };
};
