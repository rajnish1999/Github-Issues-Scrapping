const request = require('request');
const cheerio = require('cheerio');
const chalk = require('chalk');
const fs = require('fs');

const url = "https://github.com/topics";

request(url, (err, res, body) => {
    if(err){
        console.log(err);
    }else{
        extractTopics(body);
    }
})

let gitTopics = [];

const extractTopics = (body) => {
    const selectorTool = cheerio.load(body);
    const topicsArr = selectorTool('.topic-box');

    for(let i=0;i<topicsArr.length;i++){
        const partialTopicLink = selectorTool(topicsArr[i]).find('a').attr('href');
        const topicLink = "https://github.com"+partialTopicLink;
        // console.log(topicLink);
        gitTopics.push({
            topicUrl: topicLink,
            repos: []
        })
        request(topicLink, extractSubTopics.bind(null, i))
    }
}

let topicCounts=0, totalRepos=0;
const extractSubTopics = (index, err, res, body) => {
    topicCounts++;
    if(err){
        console.log(err);
    }else{
        const selectorTool = cheerio.load(body);
        const subTopicsArr = selectorTool('h3.lh-condensed a:last-child');
        const topic = selectorTool('.col-sm-10>h1').text();
        totalRepos+=subTopicsArr.length > 8 ? 8 : subTopicsArr.length;
        for(let i=0;i< (subTopicsArr.length > 8 ? 8 : subTopicsArr.length);i++){
            const subTopic = selectorTool(subTopicsArr[i]).text();
            const partialSubTopicLink = selectorTool(subTopicsArr[i]).attr('href');
            const linkSubTopic = "https://github.com"+partialSubTopicLink+"/issues";
            // console.log(partialSubTopicLink+"\n");
            gitTopics[index].repos.push({
                repoUrl: linkSubTopic,
                issues: []
            })
            request(linkSubTopic, extractIssues.bind(null, index, i))
        }
    }
    
}

let reposCount=0;
const extractIssues = (topicIndex, repoIndex, err, res, html) => {
    reposCount++;
    if(err){
        console.log(err);
    }else{
        const selectorTool = cheerio.load(html);
        const issuesLinkArr = selectorTool('.js-navigation-open.markdown-title');

        for(let i=0; i < (issuesLinkArr.length > 8 ? 8 : issuesLinkArr.length); i++){
            gitTopics[topicIndex].repos[repoIndex].issues.push({
                issueName: selectorTool(issuesLinkArr[i]).text(),
                issueUrl: "https://www.github.com"+selectorTool(issuesLinkArr[i]).attr("href")
            })
        }
        if(reposCount === totalRepos){
            fs.writeFileSync('temp.json', JSON.stringify(gitTopics))
        }
    }
}


