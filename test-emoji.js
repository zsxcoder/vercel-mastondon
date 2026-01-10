// 模拟表情渲染逻辑
function testEmojiRendering() {
  const sampleItem = {
    'id': '123',
    'content': '<p>:bongoCat: 测试表情</p>',
    'emojis': [
      {
        'shortcode': 'bongoCat',
        'url': 'https://example.com/emojis/bongoCat.png',
        'static_url': 'https://example.com/emojis/bongoCat.png',
        'visible_in_picker': true
      }
    ]
  };

  // 模拟解码HTML实体
  function decodeHTMLEntities(text) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  let decodedContent = decodeHTMLEntities(sampleItem.content);
  let processedContent = decodedContent;

  // 模拟表情渲染逻辑
  if (sampleItem.emojis && sampleItem.emojis.length > 0) {
    sampleItem.emojis.forEach(emoji => {
      const regex = new RegExp(':' + emoji.shortcode + ':', 'g');
      processedContent = processedContent.replace(regex, '<img src="' + emoji.url + '" alt="' + emoji.shortcode + '" class="emoji" style="height: 1em; width: 1em; vertical-align: middle;">');
    });
  }

  console.log('原始内容:', decodedContent);
  console.log('渲染后内容:', processedContent);
}

testEmojiRendering();