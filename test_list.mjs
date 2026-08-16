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

  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0'
    },
    body: JSON.stringify({
      query,
      variables: { favoriteSlug: listSlug }
    })
  });

  const data = await res.json();
  console.log('Total Questions:', data.data?.favoriteQuestionList?.questions?.length);
  console.log('Sample Questions:', data.data?.favoriteQuestionList?.questions?.slice(0, 5));
}

testList('a0b4xdj1');
