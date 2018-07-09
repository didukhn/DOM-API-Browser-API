window.onload = () => {

  initSettings();

  var _ALLTAGS;

  var _ALLPOSTS;
  var POSTS_PER_PAGE = 10;
  var PAGE = 1;
  window.onscroll = function () {
    if (PAGE * POSTS_PER_PAGE >= _ALLPOSTS.legth) {
      return;
    }

    var documentHeight = document.body.clientHeight - 10;
    var scrolledY = window.scrollY;
    var windowHeight = window.innerHeight;
    console.log(documentHeight, ' ', scrolledY, ' ', windowHeight);

    if (documentHeight <= scrolledY + windowHeight) {
      PAGE += 1;
      updateArticles();
    }
  }

  // get data
  fetch('https://api.myjson.com/bins/152f9j')
    .then(response => {
      response.json().then(data => {
        _ALLPOSTS = data.data;


        _ALLPOSTS = _ALLPOSTS.map(x => {
          x.createdAt = new Date(x.createdAt);
          return x;
        });
        updateArticles();
        _ALLTAGS = getAllTags(_ALLPOSTS);
        initTags();
      });
    })
    .catch(err => {
      console.log(err);
    });

  //Sort
  var btnAsc = document.getElementById('asc');
  var btnDesc = document.getElementById('desc');
  btnAsc.addEventListener('click', () => {
    setDateSorting('asc');
    updateArticles();
  });
  btnDesc.addEventListener('click', () => {
    setDateSorting('desc');
    updateArticles();
  });

  //Title search 
  var searchInput = document.getElementById('search');
  searchInput.addEventListener('keypress', () => {
    searchRes(searchInput.value, _ALLPOSTS);
  })

  //tags
  function initTags() {
    var tagContainer = document.getElementById('tags');
    for (let tag of _ALLTAGS) {
      console.log(tag);
      tagContainer.innerHTML += `<span>#${tag}</span>`;
    }
    var tagInput = document.getElementById('tagInput');
  for (var child of tagContainer.childNodes) {
    child.addEventListener('click', function () {
      if (tagInput.value != '') {
        tagInput.value += ',';
      }
      tagInput.value += this.innerText;
    })
  }
  }
  
  


  var btnSort = document.getElementById('tagsSort');
  btnSort.addEventListener('click', function () {
    var usersTags = tagInput.value.split(',');

    setTagSorting(usersTags);

    updateArticles();

  })

  function getAllTags(posts) {
    var allTags = [];
    for (let post of posts) {
      for (let tag of post.tags) {
        if (allTags.indexOf(tag) == -1)
          allTags.push(tag);
      }
    }
    return allTags;
  }

  function searchFilter(searchedText, posts) {
    var filtered = posts.filter((x) => {
      return x.title.includes(searchedText);
    });
    return filtered;
  }


  function getIntersectCount(userTagList, postTagList) {
    var count = userTagList.reduce((accumulator, tag) => {
      var tagCount = postTagList.filter(x => x == tag).length;
      return accumulator + tagCount;
    }, 0);

    return count;
  }

  function sortByTags(posts, userTags) {
    var sorted = posts.sort((a, b) => {
      var aCount = getIntersectCount(userTags, a.tags);
      var bCount = getIntersectCount(userTags, b.tags);
      if (aCount < bCount) {
        return 1;
      }
      if (aCount == bCount) {
        if (a.createdAt < b.createdAt) {
          return 1;
        }
        if (a.createdAt == b.createdAt) {
          return 0;
        }
        if (a.createdAt > b.createdAt) {
          return -1;
        }
      }
      if (aCount > bCount) {
        return -1;
      }
    })
    return sorted;
  }

  function initSettings() {
    var settings = localStorage.getItem('MY_BLOG_SETTINGS');
    settings = JSON.parse(settings);
    if (!settings) {
      settings = {
        dateSorting: 'desc',
        tagSorting: null
      };
      localStorage.setItem('MY_BLOG_SETTINGS', JSON.stringify(settings));
    }
  }

  function getBlogSettings() {
    return JSON.parse(localStorage.getItem('MY_BLOG_SETTINGS'));
  }

  function setTagSorting(userTags) {
    var settings = getBlogSettings();
    settings.dateSorting = null;
    settings.tagSorting = userTags.map(x => x.replace('#', ''));
    localStorage.setItem('MY_BLOG_SETTINGS', JSON.stringify(settings));
  }

  function setDateSorting(sortType) {
    var settings = getBlogSettings();
    settings.dateSorting = sortType;
    settings.tagSorting = null;
    localStorage.setItem('MY_BLOG_SETTINGS', JSON.stringify(settings));
  }

  function updateArticles() {
    var list = [..._ALLPOSTS];
    var settings = getBlogSettings();

    // look at state
    if (settings.dateSorting && settings.dateSorting == 'asc') {
      list = sortByDate(list, true);
    } else if (settings.dateSorting && settings.dateSorting == 'desc') {
      list = sortByDate(list, false);
    } else if (settings.tagSorting) {
      list = sortByTags(list, settings.tagSorting);
    }


    list = list.slice(0, PAGE * POSTS_PER_PAGE);

    var main = document.getElementById('main');
    main.innerHTML = '';
    for (let obj of list) {
      var article = htmlToElement(`
            <article class="card">
              <div class="photo">
                <img src="${obj.image}" alt="" width="100%">
                <button class="delete-btn"><i class="fas fa-times"></i></button>
              </div>
              <div class="other-info">
                <div class="date">${obj.createdAt}</div>
                <div class="title">${obj.title}</div>
                <div class="description">${obj.description}</div>
                <div class="tags">${obj.tags}</div>
              </div>
            </article>`);
      article.querySelector('.delete-btn').addEventListener('click', () => {
        deletePost(obj);
      });
      main.appendChild(article);
    }
  }

  function sortByDate(posts, asc) {
    var sorted = posts.sort((a, b) => {
      if (a.createdAt < b.createdAt) {
        return -1;
      }
      if (a.createdAt == b.createdAt) {
        return 0;
      }
      if (a.createdAt > b.createdAt) {
        return 1;
      }
    });

    if (!asc) {
      return sorted.reverse();
    }

    return sorted;
  }

  function deletePost(post) {
    var index = _ALLPOSTS.indexOf(post);
    _ALLPOSTS.splice(index, 1);
    updateArticles();
  }


  function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
  }
}
