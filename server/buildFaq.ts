// @ts-ignore
import {toHTML} from "./md.js";
import fs from "fs";




let inputFile = "./views/info/faq.txt";
let outputFile =  "./views/info/faq2.html";
let outputScript = "./views/info/faq.ts";

var rawTxt = fs.readFileSync(inputFile, {encoding: "utf8"});

var faqLines = rawTxt.split("\n");
var faqs: {question: string, answer: string, tags: string[]}[] = [];
var context = "";
var allTags = new Set();
for(let line of faqLines)
{
	line = line.trim();

	if(line.startsWith("Q: "))
	{
		faqs.push({
			question: "",
			answer: "",
			tags: []
		});
		line = line.substring(3);
		context = "q";
	}
	else if(line.startsWith("A: "))
	{
		line = line.substring(3);
		context = "a";
	}
	else if (line.startsWith("#"))
	{
		context = "tag";
	}

	var faq = faqs[faqs.length -1] || {};

	switch(context)
	{
		case "q":
			if(line != "")
				faq.question += line;
			break;
		case "a":
			if(line != "")
				faq.answer += line;
			break;

		case "tag":

			var pattern = /#\w[0-9A-Za-z.\-]*/g;
			var match: RegExpExecArray | null;
			while ((match = pattern.exec(line)) != null)
			{
				let tag = match[0].substring(1);
				faq.tags.push(tag);
				if(tag.indexOf(".") == -1)
					allTags.add(tag);

			}
	}
}


var lookup: {[key:string]: string[]} = {};

for(let faq of faqs)
{
	for(let tag of faq.tags)
	{
		if(!lookup[tag])
		{
			lookup[tag] = [];
		}

		lookup[tag].push(`<div class='question'>${faq.question}</div><div class='answer'>${faq.answer}</div>`);
	}
}

let allTagsArr = [...allTags];
allTagsArr.sort();
let allTagsComment = "/*\n" + allTagsArr.map(x => " * " + x).join("\n") + "\n */";

fs.writeFileSync(outputScript, allTagsComment + "\nexport default " + JSON.stringify(lookup, undefined, "\t") + " as {[k:string]: string[]}");
	