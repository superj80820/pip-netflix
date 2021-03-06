window.onresize = doLayout;
var isLoading = false;
const offset = 33;
let isPin = false;
const youtubeUrl = 'https://youtube.com/tv#'
const netflixUrl = 'https://www.netflix.com/browse'
const VERSION = "1.1.0"

/**
 * Bindings that depend on the particular collection of webviews in browser.html
 *
 * @see https://developer.chrome.com/apps/tags/webview#method-setUserAgentOverride
 */
const userAgentBindings = {
  'youtube-tv-mode': 'Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/5.0 NativeTVAds Safari/538.1'
};

function switchYoutubeOrNetflix (conditions) {
  return {
    switchUrlByYoutubeOrNetflix () {
      switch (conditions) {
        case 'Youtube':
          navigateTo('https://youtube.com/tv#')
          break;
        case 'Netflix':
          navigateTo('https://www.netflix.com/browse')
          break
      }
      return this
    },
    switchUserAgentByYoutubeOrNetflix () {
      switch (conditions) {
        case 'Youtube':
          document.querySelector('webview[data-name="webviewContent"]').setUserAgentOverride(userAgentBindings['youtube-tv-mode']);
          break;
        case 'Netflix':
          // Reset UserAgent
          document.querySelector('webview[data-name="webviewContent"]').setUserAgentOverride('');
          break
      }
      return this
    }
  }
}

function getUpdateNotification () {
  return fetch('https://api.github.com/repos/superj80820/evervideo/releases')
  .then(function(response) {
    return response.json();
  })
  .then(function(json) {
    return json
  });
}

async function checkVersion (version) {
  const updateNotifyObj = document.getElementById('updateNotify')
  const originVersionArray = await getUpdateNotification()
  const originVersionName = originVersionArray[0].tag_name
  if (version !== originVersionName) {
    updateNotifyObj.title = originVersionArray[0].body
    updateNotifyObj.style.display = "block"
    updateNotifyObj.onclick = () => {
      window.open(`https://github.com/superj80820/evervideo/archive/${originVersionName}.zip`, 'Yahoo', config='height=500,width=500');
    }
  }
}

onload = async function() {
  function downOption () {
    setLayout(offset)
    const div = document.getElementById('controls')
    document.getElementById('controls').style['-webkit-app-region'] = 'drag'
    div.style.top = '0px'
    div.style.opacity = '100%'
  }

  function upOption () {
    setLayout()
    const div = document.getElementById('controls')
    div.style['-webkit-app-region'] = null
    div.style.top = `-${offset}px`
    div.style.opacity = '0%'
  }

  checkVersion(VERSION)

  document.getElementById("draggerHandler").addEventListener("mouseenter", function() {
    downOption()
    setTimeout(() => {
      if (!isPin) upOption()
    }, 5000)
  })

  document.querySelector('#selectUri').addEventListener("change", function(uri) {
    switchYoutubeOrNetflix(uri.target.value)
      .switchUserAgentByYoutubeOrNetflix()
      .switchUrlByYoutubeOrNetflix()
  })

  var webview = document.querySelector('webview');
  setLayout();
  webview.focus();

  var version = navigator.appVersion.substr(navigator.appVersion.lastIndexOf('Chrome/') + 7);
  var match = /([0-9]*)\.([0-9]*)\.([0-9]*)\.([0-9]*)/.exec(version);
  var majorVersion = parseInt(match[1]);
  var buildVersion = parseInt(match[3]);

  // don't delete
  // document.querySelector('#back').onclick = function() {
  //   webview.back();
  // }

  document.querySelector('#pin').onclick = function() {
    function getImageUri(img) {
      style = img.currentStyle || window.getComputedStyle(img, false),
      bi = style.backgroundImage.slice(4, -1).replace(/"/g, "");
      return bi
    }
    const pinObj = document.querySelector('#pin')
    if (getImageUri(pinObj).match(/pin-outline\.svg/)) {
      pinObj.style = 'background-image: url(./assets/pin-enable.svg);'
      downOption()
      isPin = true;
    } else if (getImageUri(pinObj).match(/pin-enable\.svg/)) {
      pinObj.style = 'background-image: url(./assets/pin-outline.svg);'
      upOption()
      isPin = false;
    }
  }

  // don't delete
  // document.querySelector('#forward').onclick = function() {
  //   webview.forward();
  // };

  document.querySelector('#close').onclick = function() {
    window.close()
  };

  document.querySelector('#reload').onclick = function() {
    if (isLoading) {
      webview.stop();
    } else {
      webview.reload();
    }
  };
  document.querySelector('#reload').addEventListener(
    'webkitAnimationIteration',
    function() {
      if (!isLoading) {
        document.body.classList.remove('loading');
      }
    });

  var showClearDataConfirmation = function() {
    document.querySelector('#clear-data-overlay').style.display = '-webkit-box';
    document.querySelector('#clear-data-confirm').style.display = '-webkit-box';
  };

  var hideClearDataConfirmation = function() {
    document.querySelector('#clear-data-overlay').style.display = 'none';
    document.querySelector('#clear-data-confirm').style.display = 'none';
  };

  document.querySelector('#clear-data-ok').onclick = function() {

    hideClearDataConfirmation();

    var getAndResetCheckedValueBySelector = function(sel) {
      var val = document.querySelector(sel).checked;
      document.querySelector(sel).checked = false;
      return val;
    };

    var clearDataType = {
      appcache: getAndResetCheckedValueBySelector('#clear-appcache'),
      cookies: getAndResetCheckedValueBySelector('#clear-cookies'),
      fileSystems: getAndResetCheckedValueBySelector('#clear-fs'),
      indexedDB: getAndResetCheckedValueBySelector('#clear-indexedDB'),
      localStorage: getAndResetCheckedValueBySelector('#clear-localStorage'),
      webSQL: getAndResetCheckedValueBySelector('#clear-webSQL'),
    }

    if (majorVersion >= 44 || (majorVersion == 43 && buildVersion >= 2350)) {
      clearDataType['cache'] = getAndResetCheckedValueBySelector('#clear-cache');
    }

    webview.clearData(
      { since: 0 }, // Remove all browsing data.
      clearDataType,
      function() { webview.reload(); });
  };

  document.querySelector('#clear-data-cancel').onclick = hideClearDataConfirmation;

  // document.querySelector('#location-form').onsubmit = function(e) {
  //   e.preventDefault();
  //   navigateTo(document.querySelector('#location').value);
  // };

  webview.addEventListener('exit', handleExit);
  webview.addEventListener('loadstart', handleLoadStart);
  webview.addEventListener('loadstop', handleLoadStop);
  webview.addEventListener('loadabort', handleLoadAbort);
  webview.addEventListener('loadredirect', handleLoadRedirect);
  webview.addEventListener('loadcommit', handleLoadCommit);

  // Test for the presence of the experimental <webview> zoom and find APIs.
  if (typeof(webview.setZoom) == "function" &&
      typeof(webview.find) == "function") {
    var findMatchCase = false;

    webview.addEventListener('findupdate', handleFindUpdate);
    window.addEventListener('keydown', handleKeyDown);
  } else {
    var zoom = document.querySelector('#zoom');
    var find = document.querySelector('#find');
    zoom.style.visibility = "hidden";
    zoom.style.position = "absolute";
    find.style.visibility = "hidden";
    find.style.position = "absolute";
  }
};

function navigateTo(url) {
  resetExitedState();
  var webview = document.querySelector('webview');
  webview.focus();
  webview.src = url;
}

function doLayout() {
  setLayout()
}

function setLayout(height = 0) {
  var webview = document.querySelector('webview');
  var controls = document.querySelector('#controls');
  var controlsHeight = controls.offsetHeight;
  var windowWidth = document.documentElement.clientWidth;
  var windowHeight = document.documentElement.clientHeight;
  var webviewWidth = windowWidth;
  var webviewHeight = windowHeight - controlsHeight + offset - height;
  webview.style.width = webviewWidth + 'px';
  webview.style.height = webviewHeight + 'px';

  var sadWebview = document.querySelector('#sad-webview');
  sadWebview.style.width = webviewWidth + 'px';
  sadWebview.style.height = webviewHeight * 2/3 + 'px';
  sadWebview.style.paddingTop = webviewHeight/3 + 'px';
}

function handleExit(event) {
  console.log(event.type);
  document.body.classList.add('exited');
  if (event.type == 'abnormal') {
    document.body.classList.add('crashed');
  } else if (event.type == 'killed') {
    document.body.classList.add('killed');
  }
}

function resetExitedState() {
  document.body.classList.remove('exited');
  document.body.classList.remove('crashed');
  document.body.classList.remove('killed');
}

function handleFindUpdate(event) {
  var findResults = document.querySelector('#find-results');
  if (event.searchText == "") {
    findResults.innerText = "";
  } else {
    findResults.innerText =
        event.activeMatchOrdinal + " of " + event.numberOfMatches;
  }

  // Ensure that the find box does not obscure the active match.
  if (event.finalUpdate && !event.canceled) {
    var findBox = document.querySelector('#find-box');
    findBox.style.left = "";
    findBox.style.opacity = "";
    var findBoxRect = findBox.getBoundingClientRect();
    if (findBoxObscuresActiveMatch(findBoxRect, event.selectionRect)) {
      // Move the find box out of the way if there is room on the screen, or
      // make it semi-transparent otherwise.
      var potentialLeft = event.selectionRect.left - findBoxRect.width - 10;
      if (potentialLeft >= 5) {
        findBox.style.left = potentialLeft + "px";
      } else {
        findBox.style.opacity = "0.5";
      }
    }
  }
}

function findBoxObscuresActiveMatch(findBoxRect, matchRect) {
  return findBoxRect.left < matchRect.left + matchRect.width &&
      findBoxRect.right > matchRect.left &&
      findBoxRect.top < matchRect.top + matchRect.height &&
      findBoxRect.bottom > matchRect.top;
}

function handleKeyDown(event) {
  if (event.ctrlKey) {
    switch (event.keyCode) {
      // Ctrl+F.
      case 70:
        event.preventDefault();
        openFindBox();
        break;

      // Ctrl++.
      case 107:
      case 187:
        event.preventDefault();
        increaseZoom();
        break;

      // Ctrl+-.
      case 109:
      case 189:
        event.preventDefault();
        decreaseZoom();
    }
  }
}

function handleLoadCommit(event) {
  resetExitedState();
  if (!event.isTopLevel) {
    return;
  }

  var webview = document.querySelector('webview');
  // don't delete
  // document.querySelector('#back').disabled = !webview.canGoBack();
  // don't delete
  // document.querySelector('#forward').disabled = !webview.canGoForward();
}

function handleLoadStart(event) {
  document.body.classList.add('loading');
  isLoading = true;

  document.querySelector('#reload').style = 'background-image: url(./assets/loading.svg);'

  resetExitedState();
  if (!event.isTopLevel) {
    return;
  }
}

function handleLoadStop(event) {
  // We don't remove the loading class immediately, instead we let the animation
  // finish, so that the spinner doesn't jerkily reset back to the 0 position.
  document.querySelector('#reload').style = 'background-image: url(./assets/reload.svg);'
  isLoading = false;
}

function handleLoadAbort(event) {
  console.log('LoadAbort');
  console.log('  url: ' + event.url);
  console.log('  isTopLevel: ' + event.isTopLevel);
  console.log('  type: ' + event.type);
}

function handleLoadRedirect(event) {
  resetExitedState();
  if (!event.isTopLevel) {
    return;
  }
}

function getNextPresetZoom(zoomFactor) {
  var preset = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2,
                2.5, 3, 4, 5];
  var low = 0;
  var high = preset.length - 1;
  var mid;
  while (high - low > 1) {
    mid = Math.floor((high + low)/2);
    if (preset[mid] < zoomFactor) {
      low = mid;
    } else if (preset[mid] > zoomFactor) {
      high = mid;
    } else {
      return {low: preset[mid - 1], high: preset[mid + 1]};
    }
  }
  return {low: preset[low], high: preset[high]};
}

function increaseZoom() {
  var webview = document.querySelector('webview');
  webview.getZoom(function(zoomFactor) {
    var nextHigherZoom = getNextPresetZoom(zoomFactor).high;
    webview.setZoom(nextHigherZoom);
    document.forms['zoom-form']['zoom-text'].value = nextHigherZoom.toString();
  });
}

function decreaseZoom() {
  var webview = document.querySelector('webview');
  webview.getZoom(function(zoomFactor) {
    var nextLowerZoom = getNextPresetZoom(zoomFactor).low;
    webview.setZoom(nextLowerZoom);
    document.forms['zoom-form']['zoom-text'].value = nextLowerZoom.toString();
  });
}

function openZoomBox() {
  document.querySelector('webview').getZoom(function(zoomFactor) {
    var zoomText = document.forms['zoom-form']['zoom-text'];
    zoomText.value = Number(zoomFactor.toFixed(6)).toString();
    document.querySelector('#zoom-box').style.display = '-webkit-flex';
    zoomText.select();
  });
}

function openFindBox() {
  document.querySelector('#find-box').style.display = 'block';
  document.forms['find-form']['find-text'].select();
}
