/* 

 * 脚本名称：调试工具 vConsole v1.03
 * 修改来自：id77
 * 更新时间：2023-10-01
 * 打开活动页面自动注入console 手动执行脚本
 
*/

const $ = new Env('调试助手');
let html = $response.body || '';
let clicker_frequency = 10;
let clicker_off_zIndex = 10001;
let prefix = randomInteger(1000, 10000);

try {
  let url = $request.url.replace(/&un_area=[\d_]+/g, '');
  let tools = `
    <div id="_${prefix}_id77_btns">
      <div id="_${prefix}_top"></div>
      <div id="_${prefix}_bottom">
        <div id="clicker" class="_${prefix}_id77_btn _${prefix}_id77_hide"></div>
        <div id="open_url" class="_${prefix}_id77_btn _${prefix}_id77_hide"></div>
        <div id="reload" class="_${prefix}_id77_btn _${prefix}_id77_hide" onclick="location.reload()"></div>
      </div>
    </div>
    `;
  let copyObject = `
    <script ignore>
    if(window.localStorage) {
      window.localStorageCopy = window.localStorage
    }
    if(window.sessionStorage) {
      window.sessionStorageCopy = window.sessionStorage
    }
    const _${prefix}_id77_Map = Map;
    </script>
    `;
  let scriptDoms = `<script src="https://unpkg.com/vconsole@3.14.6/dist/vconsole.min.js" ignore></script>`;
  let mitmContent = `
    <style>
    body > a {
        display: inline-block !important;
    }
    .vc-tab._${prefix}_id77_hide {
      display: none !important;
    }
    * {
      -webkit-user-select: auto !important;
      user-select: auto !important;
    }
    #clicker {
      top: 0;
      background: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNjgxODg0MTU4NjEyIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjE4ODEiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNzIiIGhlaWdodD0iNzIiPjxwYXRoIGQ9Ik0zMDMuODcyIDM1MS4yNTMzMzNjMjEuMDc3MzMzLTYxLjAxMzMzMyA4OS43MjgtODggMTUzLjE5NDY2Ny02MC4zNzMzMzNsNDA1LjA1NiAxNzYuMjM0NjY3YTE0MC4zMDkzMzMgMTQwLjMwOTMzMyAwIDAgMSA3NC4yNCA3Ny4xNDEzMzNjMjUuMDI0IDY0LjM2MjY2Ny01LjAzNDY2NyAxMzEuNDEzMzMzLTY3LjA5MzMzNCAxNDkuNzgxMzMzbC0xMjEuMzg2NjY2IDM1Ljk2OC00OS42NjQgMTQ1LjQyOTMzNGExMDQuMTcwNjY3IDEwNC4xNzA2NjcgMCAwIDEtNjEuMTYyNjY3IDYzLjkzNmwtOC44NTMzMzMgMy4wMjkzMzNjLTYyLjE4NjY2NyAxOC4yNjEzMzMtMTMyLjY5MzMzMy0xOS4xNzg2NjctMTU3LjYxMDY2Ny04My42MDUzMzNMMzA2LjQxMDY2NyA0MzQuMzQ2NjY3YTEyMC45ODEzMzMgMTIwLjk4MTMzMyAwIDAgMS0yLjU2LTgzLjExNDY2N3ogbTgwLjk2LTI3NC4yODI2NjZjMTA5LjA1NiAwIDIwOCA1OS40OTg2NjcgMjYyLjc4NCAxNTQuMjRhNDcuOTU3MzMzIDQ3Ljk1NzMzMyAwIDAgMS04My4wMjkzMzMgNDhjLTM3Ljk3MzMzMy02NS42MjEzMzMtMTA1LjYtMTA2LjM2OC0xNzkuNzU0NjY3LTEwNi4zNjgtMTE1LjYyNjY2NyAwLTIxMC4xMzMzMzMgOTguMzY4LTIxMC4xMzMzMzMgMjIwLjY1MDY2NiAwIDY4Ljg0MjY2NyAzMC4xNDQgMTMyLjIwMjY2NyA4MC42MTg2NjYgMTczLjc2YTQ3Ljk1NzMzMyA0Ny45NTczMzMgMCAwIDEtNjAuOTcwNjY2IDc0LjAyNjY2N2MtNzIuNTMzMzMzLTU5LjczMzMzMy0xMTUuNTQxMzMzLTE1MC4xODY2NjctMTE1LjU0MTMzNC0yNDcuNzg2NjY3IDAtMTc0LjM3ODY2NyAxMzYuNTc2LTMxNi41MjI2NjcgMzA2LjAyNjY2Ny0zMTYuNTIyNjY2eiIgZmlsbD0iIzExOTZkYiIgcC1pZD0iMTg4MiI+PC9wYXRoPjwvc3ZnPg==) #FFF no-repeat 0.3571em/1.88em;
    }
    #open_url {
      top: 3em;
      background: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNjcyMDI0OTU1NzcxIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9Ijk0ODkiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiPjxwYXRoIGQ9Ik02NjQuNTc2IDg5Ni40MjY2NjdsMTA4LjU4NjY2Ny0xMDguNTg2NjY3aC0zMDEuMDEzMzM0di01OS43MzMzMzNoMzAxLjY1MzMzNGwtMTA5LjIyNjY2Ny0xMDkuMjI2NjY3IDQyLjI0LTQyLjI0IDE4MC45OTIgMTgxLjAzNDY2N0w3MDYuODE2IDkzOC42NjY2Njd6TTQ3MS44OTMzMzMgOTM4LjY2NjY2N0gyMDAuMTQ5MzMzYTYzLjYxNiA2My42MTYgMCAwIDEtMjQuOTE3MzMzLTUuMDM0NjY3IDY0IDY0IDAgMCAxLTEwLjg4LTUuODg4IDY0LjI5ODY2NyA2NC4yOTg2NjcgMCAwIDEtOS40NzItNy44MDggNjQuODk2IDY0Ljg5NiAwIDAgMS03LjgwOC05LjQ3MiA2NCA2NCAwIDAgMS01Ljg4OC0xMC44OCA2My42NTg2NjcgNjMuNjU4NjY3IDAgMCAxLTUuMDM0NjY3LTI0LjkxNzMzM3YtNzI1LjMzMzMzNGE2My42NTg2NjcgNjMuNjU4NjY3IDAgMCAxIDUuMDM0NjY3LTI0LjkxNzMzMyA2NCA2NCAwIDAgMSA1Ljg4OC0xMC44OCA2NC4zODQgNjQuMzg0IDAgMCAxIDcuODA4LTkuNDcyIDY0IDY0IDAgMCAxIDkuNDcyLTcuODA4IDY0IDY0IDAgMCAxIDEwLjg4LTUuODg4QTYzLjYxNiA2My42MTYgMCAwIDEgMjAwLjE0OTMzMyA4NS4zMzMzMzNoNDA1LjMzMzMzNGwyMTMuMzMzMzMzIDIxMy4zMzMzMzR2MjM0LjY2NjY2NmgtNTkuNzMzMzMzVjM4NGgtMjM4LjkzMzMzNFYxNDUuMDY2NjY3aC0zMjQuMjY2NjY2djczMy44NjY2NjZoMjc2LjAxMDY2NlY5MzguNjY2NjY3eiBtMTA3Ljk4OTMzNC02MTQuNGgxNzkuMnYtMC43NjhsLTE3OS4yLTE3OS4yIDAuNzY4IDAuNzY4aC0wLjc2OHoiIHAtaWQ9Ijk0OTAiIGZpbGw9IiMxMjk2ZGIiPjwvcGF0aD48L3N2Zz4=) #FFF no-repeat 0.3571em/1.88em;
    }
    #reload {
      top: 6em;
      background: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNjgwNzU0MTA2MjQwIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9Ijc4MTAiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiPjxwYXRoIGQ9Ik05NTAuMzcxMDcyIDUzMi43OTU2MjlsLTg0LjM5ODIwMi04NC4zOTMwODVjLTYuMTAxOTc1LTYuMDk2ODU4LTE0LjA5Mzk5Ni05LjE0NTI4Ny0yMi4wODcwNDEtOS4xNDMyNDEtNy45OTUwOTEtMC4wMDEwMjMtMTUuOTg4MTM2IDMuMDQ3NDA2LTIyLjA3OTg3OCA5LjE0ODM1N2wtODQuNTE5OTc1IDg0LjUzMDIwOWMtMTIuMjAwODggMTIuMTk1NzYzLTEyLjIwMDg4IDMxLjk3MTE1NiAwIDQ0LjE3MTAxMiA2LjA5OTkyOCA2LjA5NDgxMiAxNC4wOTE5NSA5LjE0NTI4NyAyMi4wODI5NDggOS4xNDUyODdzMTUuOTkzMjUzLTMuMDUwNDc2IDIyLjA4Mjk0OC05LjE1MDQwNGwzMy4xNzE0OTQtMzMuMTc1NTg3Yy0xNi4wMTk4NTkgMTc1LjMzMDIxNC0xNjMuODEzOTI2IDMxMy4xNDUtMzQzLjI1MDY2OCAzMTMuMTQ1LTE5MC4wOTY1MjMgMC0zNDQuNzQ5ODEyLTE1NC42NTMyODktMzQ0Ljc0OTgxMi0zNDQuNzQ5ODEyczE1NC42NTMyODktMzQ0Ljc1NDkyOCAzNDQuNzQ5ODEyLTM0NC43NTQ5MjhjOTIuMDg0MjU1IDAgMTc4LjY1ODAwNiAzNS44NTk3MTkgMjQzLjc3OTE2NiAxMDAuOTc1NzYyIDEyLjIwMDg4IDEyLjIwMDg4IDMxLjk2NjAzOSAxMi4yMDA4OCA0NC4xNjY5MTkgMCAxMi4yMDA4OC0xMi4xOTU3NjMgMTIuMjAwODgtMzEuOTcxMTU2IDAtNDQuMTY2OTE5LTc2LjkxNDc2NC03Ni45MTk4OC0xNzkuMTc2ODIyLTExOS4yNzY1Ny0yODcuOTQ2MDg1LTExOS4yNzY1Ny0yMjQuNTQzMDU2IDAtNDA3LjIxNzUzOSAxODIuNjc5NTk5LTQwNy4yMTc1MzkgNDA3LjIyMjY1NSAwIDIyNC41Mzc5MzkgMTgyLjY3NDQ4MyA0MDcuMjE3NTM5IDQwNy4yMTc1MzkgNDA3LjIxNzUzOSAyMTIuNjA0MTQyIDAgMzg3LjU3NDE1My0xNjMuODAwNjIzIDQwNS41OTE1MDUtMzcxLjgwODA3NGwyOS4yMzk5NTEgMjkuMjM4OTI4YzYuMDk5OTI4IDYuMDk0ODEyIDE0LjA5MTk1IDkuMTQ1Mjg3IDIyLjA4Mjk0OCA5LjE0NTI4NyA3Ljk5MDk5OCAwIDE1Ljk4MzAyLTMuMDUwNDc2IDIyLjA4Mjk0OC05LjE1MDQwNEM5NjIuNTcxOTUyIDU2NC43NzA4NzcgOTYyLjU3MTk1MiA1NDQuOTk1NDg1IDk1MC4zNzEwNzIgNTMyLjc5NTYyOXoiIGZpbGw9IiMxMTk2ZGIiIHAtaWQ9Ijc4MTEiPjwvcGF0aD48cGF0aCBkPSJNNDExLjI0NDI0OCA0MjkuMDk5OTE4bDIyLjA4Mjk0OC0yMi4wODI5NDhjMTIuMjAwODgtMTIuMTk1NzYzIDEyLjIwMDg4LTMxLjk3MTE1NiAwLTQ0LjE2NjkxOS0xMi4yMDA4OC0xMi4yMDA4OC0zMS45NjYwMzktMTIuMjAwODgtNDQuMTY2OTE5IDBsLTIyLjA4Mjk0OCAyMi4wODI5NDhjLTEyLjIwMDg4IDEyLjE5NTc2My0xMi4yMDA4OCAzMS45NzExNTYgMCA0NC4xNjY5MTkgNi4wOTk5MjggNi4wOTk5MjggMTQuMDkxOTUgOS4xNTA0MDQgMjIuMDgyOTQ4IDkuMTUwNDA0UzQwNS4xNDMyOTcgNDM1LjE5OTg0NyA0MTEuMjQ0MjQ4IDQyOS4wOTk5MTh6IiBmaWxsPSIjMTE5NmRiIiBwLWlkPSI3ODEyIj48L3BhdGg+PHBhdGggZD0iTTU2NS44NDYzNzIgNTM5LjUzNjE0NmwtMjIuMDgyOTQ4IDIyLjA4Mjk0OGMtMTIuMjAwODggMTIuMTk1NzYzLTEyLjIwMDg4IDMxLjk3MTE1NiAwIDQ0LjE2NjkxOSA2LjA5OTkyOCA2LjA5OTkyOCAxNC4wOTE5NSA5LjE1MDQwNCAyMi4wODI5NDggOS4xNTA0MDRzMTUuOTgzMDItMy4wNTA0NzYgMjIuMDgyOTQ4LTkuMTUwNDA0bDIyLjA4Mjk0OC0yMi4wODI5NDhjMTIuMjAwODgtMTIuMTk1NzYzIDEyLjIwMDg4LTMxLjk3MTE1NiAwLTQ0LjE2NTg5NkM1OTcuODEyNDExIDUyNy4zMzUyNjcgNTc4LjA0NzI1MiA1MjcuMzM1MjY3IDU2NS44NDYzNzIgNTM5LjUzNjE0NnoiIGZpbGw9IiMxMTk2ZGIiIHAtaWQ9Ijc4MTMiPjwvcGF0aD48cGF0aCBkPSJNMzM2LjQ1Mzg2OCA1MjEuMDkzMDk5Yy00Ljg2OTkxNCAyMC42Nzk5OTUtNC44MDk1MzkgNjMuOTk3NTcgMjYuMzczNjcxIDk1LjE3NTY2MyAyMi42NjMxNjIgMjIuNjU4MDQ2IDUxLjk0NDA0NiAyOS4wMzIyMiA3NC4xODA0OSAyOS4wMzIyMiA4LjE5NDYzNiAwIDE1LjQzMzUwNC0wLjg2ODc4NyAyMS4wMjU4NzItMi4xMDQ5NDEgMTYuNjk0MjE3LTMuNjkxMDY1IDI3LjExNTU2OC0yMC4wNzAxMDQgMjMuNjM4MzczLTM2LjgxMDM3MS0zLjQ3NzE5NC0xNi43MzAwMzMtMTkuOTY4Nzk3LTI3LjU3ODEwMi0zNi43NTQwODktMjQuMjU4NDk3LTAuMjUzNzggMC4wMzU4MTYtMjMuNTE2NiA0LjM3NjY4MS0zNy45MjM3MjgtMTAuMDMwNDQ3LTE0LjAxMDA4NS0xNC4wMjAzMTgtOS45NTM2OTktMzUuNTM5NDI0LTkuNjU4OTg3LTM3LjAwMzc3NSAzLjc0MTIwNy0xNi42NzM3NTEtNi42MzkyMTEtMzMuMzAyNDc3LTIzLjMxMjk2Mi0zNy4yMzE5NzNDMzU3LjI2NTg3IDQ5My44OTA1NSAzNDAuNDA4OTQ3IDUwNC4yOTY1NTEgMzM2LjQ1Mzg2OCA1MjEuMDkzMDk5eiIgZmlsbD0iIzExOTZkYiIgcC1pZD0iNzgxNCI+PC9wYXRoPjwvc3ZnPg==) #FFF no-repeat 0.3571em/1.88em;
    }
    .vc-panel {
      z-index: 100000 !important;
    }
    #_${prefix}_top {
      position: fixed;
      z-index: 99999;
      top: 22%;
      right: 0;
    }
    #_${prefix}_bottom {
      position: fixed;
      z-index: 99999;
      bottom: 25%;
      right: 0;
    }
    ._${prefix}_id77_btn, ._${prefix}_id77_btn_b {
      position: absolute;
      right: 0;
      box-sizing: content-box;
      width: 1.14em;
      height: 2.1429em;
      padding: 0 1.4286em 0 0;
      border: 1px solid rgba(255,255,255,0.8);
      background: #FFF;
      border-radius: 50px 0 0 50px;
      background-size: 80%;
      overflow: hidden;
    }
    ._${prefix}_id77_btn img, ._${prefix}_id77_btn_b img {
      box-sizing: content-box;
      max-width: 2.1429em !important;
      width: 2.1429em !important;
      height: 2.1429em !important;
      border: 1px solid rgba(255,255,255,0.8);
      background: #FFF;
      border-radius: 50px 0 0 50px;
    }
    #_${prefix}_id77_btns {
      font-size: 14px;
    }
    ._${prefix}_id77_btn._${prefix}_id77_hide {
      display: none !important;
    }
    </style>
    <script ignore>
    const _${prefix}_id77_needHideSwitch = localStorage.getItem('vConsole_switch_hide') === 'Y';
      const _${prefix}_id77_btnsDom = \`${tools}\`;
    _${prefix}_id77_onReady(_${prefix}_id77_init);

    function _${prefix}_id77_onReady(fn){
        try {
          const readyState = document.readyState;
          if(readyState === 'interactive' || readyState === 'complete') {
            fn()
          }else{
            window.addEventListener("DOMContentLoaded",fn);
          }
        } catch (error) {
          console.error(arguments.callee.name, error);
        }
      }

      function _${prefix}_id77_changeBtns() {
        const \$btns = document.querySelectorAll('._${prefix}_id77_btn');
        Array.prototype.forEach.call(\$btns, function(el, i){
          if (el.classList.contains('_${prefix}_id77_hide')){
            el.classList.remove('_${prefix}_id77_hide');
          } else {
            el.classList.add('_${prefix}_id77_hide');
          }
        });
      }

      function _${prefix}_id77_changeMitmUI() {
        const vcSwitch = document.querySelector('.vc-switch');
        if (vcSwitch.style.display == 'none') {
          _${prefix}_id77_vConsole.showSwitch();
          localStorage.setItem('vConsole_switch_hide', 'N')
        } else {
          _${prefix}_id77_vConsole.hideSwitch();
          localStorage.setItem('vConsole_switch_hide', 'Y')
        }
      _${prefix}_id77_changeBtns();
      }

      document.addEventListener('dblclick', function (e) {
        _${prefix}_id77_changeMitmUI();
      });

      function _${prefix}_id77_init () {
        document.querySelector('body').insertAdjacentHTML('beforeend', _${prefix}_id77_btnsDom);

        try {
          if(!window.localStorage) {
            window.localStorage = window.localStorageCopy
          }
          if(!window.sessionStorage) {
            window.sessionStorage = window.sessionStorageCopy
          }

          const  _${prefix}_id77_vConsoleOptions = {
            onReady: () => {
              setTimeout(() => {
                console.log("vConsole v3.14.6 #${prefix}");
                console.info(window.location.href);
              },3000);
            }
          }

          Map = _${prefix}_id77_Map;
          window._${prefix}_id77_vConsole = new VConsole(_${prefix}_id77_vConsoleOptions);
          if (_${prefix}_id77_needHideSwitch) {
            _${prefix}_id77_vConsole.hideSwitch();
          }

          const _Plugin = new VConsole.VConsolePlugin("id77_plugin", "工具");

          _Plugin.on("addTool", function (callback) {

            const toolList = [];
            const clickerDom = document.querySelector('#clicker');
            if (clickerDom) {
              clickerDom.addEventListener('click', (e) => {
                document.querySelector('#id77_clicker').style.display = 'block';
                e.stopPropagation();
              });
            }
            const openUrlDom = document.querySelector('#open_url');
            if (openUrlDom) {
              openUrlDom.addEventListener('click', function() {
                window.location.href = 'Foxok://url?${url}';
              });
            }
            callback(toolList);
          });

          _Plugin.on('ready', function() {
            if (!_${prefix}_id77_needHideSwitch) {
              const \$btns = document.querySelectorAll('._${prefix}_id77_btn');
              Array.prototype.forEach.call(\$btns, function(el, i){
                el.classList.remove('_${prefix}_id77_hide');
              });
            }

            const fontSize = document.querySelector('#__vconsole').style.fontSize;

            if(fontSize) {
              document.querySelector('#_${prefix}_id77_btns').style.fontSize = fontSize;
            }

          });

          function scrollTopToCKDom(reset) {
            const fontSize = document.querySelector('#__vconsole').style.fontSize;
            const _VCcontext = document.querySelector('.vc-content');

            if (reset) {
              _VCcontext.scrollTop = 0;
              return;
            }

            if(!window.localStorage) {
              window.localStorage = window.localStorageCopy
            }
            if(!window.sessionStorage) {
              window.sessionStorage = window.sessionStorageCopy
            }
          }

          _Plugin.on('show', scrollTopToCKDom);
          _Plugin.on('showConsole', scrollTopToCKDom);
          _Plugin.on('hideConsole', () => scrollTopToCKDom(true));
          _${prefix}_id77_vConsole.addPlugin(_Plugin);
          _${prefix}_id77_vConsole.showPlugin("id77_plugin");
          _${prefix}_id77_vConsole.showPlugin("default");

          function createDom(str) {
            let newDiv = document.createElement("div");
            let newContent = document.createTextNode(str);
            newDiv.appendChild(newContent);
            newDiv.style.fontSize = "16px";
            newDiv.addEventListener('click', (e) => {
              _${prefix}_id77_copyText(str)
            })
            return newDiv;
          }
        } catch (err) {
          console.log(arguments.callee.name, err);
        }
      }

      function _${prefix}_id77_copyText(text) {
        const input = document.createElement('input');
        input.setAttribute('readonly', 'readonly');
        input.setAttribute('value', text);
        document.body.appendChild(input);
        input.setSelectionRange(0, input.value.length);
        if (document.execCommand('copy')) {
          document.execCommand('copy');
          console.log('复制成功');
        }
        document.body.removeChild(input);
      }
    </script>
    <style>
      [data-tippy-root] {
        z-index: ${clicker_off_zIndex} !important;
      }
      #id77_clicker {
        background: #fff;
        z-index: 8888;
        font-size:16px;
      }
      .id77_float {
        float: left;
        margin-right: 15px;
      }
      .tippy-box .el-tgl {
        display: none !important;
      }
     .id77_clicker_main p {
        font-weight: bold;
      }

     #id77_clicker_timerTime {
        font-size: 16px;
        width: 80px;
      }
     #id77_clicker_timerBeforehandTime {
        font-size: 16px;
      }

    .id77_clicker_add {
        color: #fff;
        background: #0075ff;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        line-height: 50px;
        text-align: center;
        font-size: 30px;
        margin: 10px auto;
      }

      #id77_timer input[type="checkbox"] {
        /*
        display: none;这样会让tab键无法选取自定义的checkbox，所以使用下面的方法
        clip 属性剪裁绝对定位元素。
        */
        position: absolute;
        clip: rect(0, 0, 0, 0)
      }

      #id77_timer input[type="checkbox"] {
        display: inline-block;
        width: 48%;
        margin-top: 10px;
        margin-left: 5px;
        text-align: left;
        box-sizing: border-box;
      }

     #id77_timer label::before {
        content: '\\a0';
        display: inline-block;
        border: 1px solid silver;
        text-align: center;
        width: 20px;
        height: 20px;
        font-weight: bold;
      }

     #id77_timer input[type="checkbox"]:checked+label::before {
        content: '\\2713';
        color: #0075ff;
      }

     .id77_clicker_main input,
     .id77_clicker_main select {
        margin-bottom: 15px;
        font-size: 14px;
      }

     .id77_clicker_main {
        padding: 5px 16px;
        margin: 0 0 80px;
      }

     .id77_clicker_main input[type='number'],
     .id77_clicker_main input[type='time'],
     .id77_clicker_main select {
        border: 1px solid #e5e5e5 !important;
        border-radius: 5px;
        height: 36px;
        box-sizing: border-box;
        padding: 10px;
        float: left;
        margin-right: 15px;
      }

      /* ----------------*/
      .moveable-control-box {
        display: none !important;
        all: initial;
      }

      .tippy-box {
        max-width: min(350px, 90vw) !important;
      }

      .tippy-box:focus {
        outline: 0;
      }

      .tpa-tooltip-content-root {
        text-shadow: initial;
        margin: 0;
        padding: 8px;
        color: grey;
        background-color: white;
        border-color: lightgray;
        border-style: solid;
        border-width: 1px;
        border-radius: 8px;
        user-select: none;
      }

      .tpa-tooltip-options-container {
        display: flex;
        flex-direction: row;
        align-content: center;
        align-items: center;
      }

      .tpa-tooltip-options-container > * {
        all: initial;
      }

      .tpa-tooltip-content-root-arrow-icon {
        width: 30px;
        height: 30px;
        display: inline-block;
        line-height: 30px;
        -webkit-flex-shrink: 0;
        -ms-flex-negative: 0;
        flex-shrink: 0;
        color: white;
        vertical-align: middle;
      }

      .tpa-tooltip-content-root-arrow {
        background-color: transparent;
        border: 0;
        animation: tpa-tooltip-content-root-arrow-ani 500ms ease-in-out;
        animation-iteration-count: infinite;
        animation-direction: alternate-reverse;
      }

      .tpa-tooltip-content-root-options {
        font-family: initial;
        font-size: 16px !important;
      }

      .tpa-tooltip-content-root-drag {
        font-size: 16px !important;
        word-wrap: break-word !important;
      }

      .tpa-tooltip-content-root-drag strong {
        font: initial;
        font-size: 16px !important;
        font-weight: bold;
      }

      .tpa-tooltip-content-root span {
        color: #eb1313 !important;
      }

      .tpa-inner-clicker {
        filter: unset !important;
        box-shadow: unset !important;
        text-shadow: unset !important;
        float: left !important;
        /*position: static !important;*/
        border-radius: 50% !important;
        width: 48px !important;
        height: 48px !important;
        font-size: 30px;
      }

      .tpa-inner-clicker-error {
        padding-left: 3px;
      }

      div.tpa-click-effect {
        position: absolute !important;
        box-sizing: border-box !important;
        border-style: solid !important;
        border-radius: 50% !important;
        animation: tpa-click-effect-ani 200ms ease-out !important;
        border-width: 2px !important;
        /*border-color: #86d993;*/
        /*border-color: #7056ff;*/
        border-color: lightgray !important;
      }

      @keyframes tpa-tooltip-content-root-arrow-ani {
        0% {
          transform: none;
        }

        100% {
          transform: translateX(-30px);
        }
      }

      @keyframes tpa-click-effect-ani {
        0% {
          width: 9px;
          height: 9px;
          margin: -4.5px;
          opacity: 1;
        }

        100% {
          width: 48px;
          height: 48px;
          margin: -24px;
          opacity: 0.2;
        }
      }
    </style>
    <div id="id77_clicker" style="position: fixed; bottom: 0; width: 100%; display: none;">
      <div
        class="id77_clicker_header"
        style="
          background: #f2f2f2;
          padding: 10px;
          text-align: center;
          font-weight: bold;
          border-top: 1px solid #c5c5c5;
          border-bottom: 1px solid #c5c5c5;
          border-radius: 5px 5px 0 0;
        "
      >
        Clicker
      </div>
      <div
        class="id77_clicker_close"
        style="
          position: absolute;
          top: 0px;
          text-align: center;
          padding: 10px;
          right: 0;
          font-weight: bold;
          color: #2e85ed;
        "
      >
        完成
      </div>
      <div class="id77_clicker_main">
        <div class="id77_clicker_add">+</div>
        <div style="overflow: hidden">
          <p>频率（每秒点击次数）</p>
          <input type="number" id="id77_clicker_frequency_text" value="${clicker_frequency}"/>
          <input
            type="range"
            id="id77_clicker_frequency"
            name="volume"
            value="${clicker_frequency}"
            min="1"
            max="60"
          />
        </div>
        <div style="overflow: hidden">
          <p>结束条件</p>
          <input id="id77_clicker_conditionValue" value="86400" type="number" />
          <select id="id77_clicker_condition" name="type">
            <option selected="selected" value="time">持续时间(秒)</option>
            <option value="count">总次数</option>
          </select>
        </div>
        <div id="id77_timer" style="overflow: hidden">
          <p>定时执行</p>
          <input
            class="id77_float"
            type="checkbox"
            id="id77_clicker_timerFlag"
            name="timer"
          />
          <label class="id77_float" for="id77_clicker_timerFlag">启用定时器</label>
          <input class="id77_float" id="id77_clicker_timerTime" type="time" />
          <input
            id="id77_clicker_timerBeforehandTime"
            class="id77_float"
            type="number"
            placeholder="可提前0-1000"
            min="0"
            max="1000"
            value="70"
          />
        </div>
        <div>
          <p>坐标系</p>
          <input
            type="radio"
            id="coordinate1"
            name="coordinate"
            value="1"
            checked
          />
          <label for="coordinate1">局部</label>
          <input type="radio" id="coordinate2" name="coordinate" value="2" />
          <label for="coordinate2">全局</label>
        </div>
      </div>
    </div>
    <script ignore>
      document
          .querySelector('#id77_clicker_frequency')
          .addEventListener('input', (e) => {
            document.querySelector('#id77_clicker_frequency_text').value =
              e.target.value;
          });
      document
          .querySelector('#id77_clicker_frequency_text')
          .addEventListener('input', (e) => {
            document.querySelector('#id77_clicker_frequency').value =
              e.target.value;
          });
      let id77_time = Date.now(),
      id77_date = new Date(id77_time + 60 * 1000),
      id77_hh =
        id77_date.getHours() < 10
          ? '0' + id77_date.getHours()
          : id77_date.getHours(),
      id77_mm =
        id77_date.getMinutes() < 10
          ? '0' + id77_date.getMinutes()
          : id77_date.getMinutes();
        document.querySelector('#id77_clicker_timerTime').value = id77_hh + ':' + id77_mm + ':00';
    </script>
    <script src="https://cdn.jsdelivr.net/gh/id77/QuantumultX@master/Script/clicker_cdnv4.js" ignore></script>
  `;

  // if (/<script.*v(C|c)onsole(\.min)?\.js.+?script>/i.test(html)) {
  //   html = html.replace(/<script.*v(C|c)onsole(\.min)?\.js.+?script>/i, ``);
  // }
  html = html.replace(/(<head>)/i, `$1<meta charset="utf-8" />`);
  if (/(<(?:style|link|script)[\s\S]+?<\/head>)/i.test(html)) {
    html = html.replace(
      /(<(?:style|link|script)[\s\S]+?<\/head>)/i,
      `${copyObject}${scriptDoms}${mitmContent}$1`
    );
  } else {
    html = html.replace(
      /(<\/head>|<script|<div)/i,
      `${copyObject}${scriptDoms}${mitmContent}$1`
    );
  }
} catch (error) {
  console.log(error);
}

function randomInteger(min, max) {
  // now rand is from  (min-0.5) to (max+0.5)
  let rand = min - 0.5 + Math.random() * (max - min + 1);
  return Math.round(rand);
}

$.done({
  body: html
});


// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } isShadowrocket() { return "undefined" != typeof $rocket } isStash() { return "undefined" != typeof $environment && $environment["stash-version"] } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, a] = i.split("@"), n = { url: `http://${a}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), a = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(a); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { if (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) }); else if (this.isQuanX()) this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t && t.error || "UndefinedError")); else if (this.isNode()) { let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: i, statusCode: r, headers: o, rawBody: a } = t, n = s.decode(a, this.encoding); e(null, { status: i, statusCode: r, headers: o, rawBody: a, body: n }, n) }, t => { const { message: i, response: r } = t; e(i, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) }); else if (this.isQuanX()) t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t && t.error || "UndefinedError")); else if (this.isNode()) { let i = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...o } = t; this.got[s](r, o).then(t => { const { statusCode: s, statusCode: r, headers: o, rawBody: a } = t, n = i.decode(a, this.encoding); e(null, { status: s, statusCode: r, headers: o, rawBody: a, body: n }, n) }, t => { const { message: s, response: r } = t; e(s, r, r && i.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, i = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": i } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), this.isSurge() || this.isQuanX() || this.isLoon() ? $done(t) : this.isNode() && process.exit(1) } }(t, e) }
