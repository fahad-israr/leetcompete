const https = require('https');

async function testList(listSlug) {
  const query = `
    query favoriteQuestionList($favoriteSlug: String!) {
      favoriteQuestionList(favoriteSlug: $favoriteSlug) {
        questions {
          questionFrontendId
          title
          titleSlug
          difficulty
          topicTags {
            name
          }
        }
        totalLength
      }
    }
  `;

  const postData = JSON.stringify({
    query,
    variables: { favoriteSlug: listSlug }
  });

  return new Promise((resolve, reject) => {
    const req = https.request('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

testList('a0b4xdj1').then(res => {
  console.log('Result:', JSON.stringify(res, null, 2).slice(0, 1000));
}).catch(console.error);
