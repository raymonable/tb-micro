/* import socket.io :) */
if (!!document.querySelector('.tb-window')) {
    alert('A Trollbox Micro instance is already running.\nTry holding TAB if you can\'t find it!');
}
if (window.io != null) {
    Trollbox.Init();
} else {
    fetch('https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js')
    .then(resp => resp.text()).then((resp) => {
        eval(resp);
        var style = document.createElement('style');
        style.innerHTML = `
        .tb-window {
            min-width: 150px;
            max-width: 500px;
            min-height: 150px;
            position: fixed;
            box-shadow: 2px 2px 0 3px black;
            background: white;
            z-index: 9999;
        }
        .tb-window.tb-invisible {
            display: none;
        }
        .tb-window .tb-window-inner {
            width: calc(100% - 10px);
            height: calc(100% - 35px);
            float: left;
            position: relative;
            top: 0;
            left: 0;
            margin: 0;
            padding: 5px;
        }
        .tb-window .tb-window-header {
            width: 100%;
            height: 25px;
            float: left;
            position: relative;
            top: 0;
            left: 0;
            margin: 0;
            pointer-events: none;
        }
        .tb-window .tb-window-header-inner {
            padding-left: 5px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-self: flex-start;
            float: left;
        }
        .tb-window .tb-window-btn {
            width: 25px;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            justify-self: flex-end;
            float: right;
            pointer-events: all;
            cursor: pointer;
        }
        .tb-chat {
            height: 350px;
            width: 300px;
            float: left;
            overflow-y: scroll;
            text-overflow: ellipsis;
            overflow-x: hidden;
        }
        .tb-list {
            width: 150px;
            height: 350px;
            text-align: right;
            padding-right: 25px;
            overflow-y: scroll;
            overflow-x: hidden;
            float: right;
        }
        .tb-input {
            width: calc(100% - 100px);
            border: none;
            outline: none;
            background: none;
            box-shadow: 4px 0 0 0 white, 5px 0 0 0 black;
        }
        .tb-input-btn {
            width: 50px;
            float: right;
        }`;
        document.head.appendChild(style);
        setTimeout(() => {
            Trollbox.Init();
        }, 100);
    });
}
var Trollbox = new class {
    async Init() {
        this.#Nickname = prompt('nick') || 'Anonymous';
        this.#ProfaneList = JSON.parse(await fetch('https://cdn.jsdelivr.net/gh/zacanger/profane-words@latest/words.json').then(resp => resp.text()))
        var randcolors = [
            'red',
            'blue',
            'purple',
            'pink',
            'yellow',
            'green',
            'lime'
        ]
        this.#Color = randcolors[Math.floor(Math.random() * randcolors.length)];
        this.#Primary = this.CreateWindow('Trollbox Micro',`
        <div class="tb-chat">
            Joining Room..<br>
            Please wait.<p></p>
            Did you know that you can hold the \\ key to hide Trollbox Micro?
        </div>        
        <div class="tb-list">

        </div>
        <input class="tb-input" placeholder="Chat"><button class="tb-input-btn">Send</button>
        `);
        var primary = this.#Primary;
        primary[0].querySelector('.tb-window-btn').addEventListener('click', primary[1]);
        var fm = false;
        this.#Socket = io('https://trollbox.party', {
            path: '/api/v0/si'
        });
        var socket = this.#Socket
        socket.on('message',  (d) => {
            if (!fm) {
                primary[0].querySelector('.tb-chat').innerHTML = '';
            }
            fm = true;
            this.Message(d.nick, d.color, d.msg)
        });
        socket.on('update users', (data) => {
            primary[0].querySelector('.tb-list').innerHTML = '';
            var users = [];
            for (var key in data) {
                if (data[key].home != "trollbox") {
                    users.push(data[key].nick);
                    
                }
            }
            users.forEach((user) => {
                primary[0].querySelector('.tb-list').innerHTML += user + '<br>'
            })
        });
        socket.on('_connected', () => {
            socket.emit('user joined', this.#Nickname, this.#Color);
        });
        primary[0].querySelector('.tb-input').addEventListener('keyup', (e) => {
            if (e.key == "Enter") {
                primary[0].querySelector('.tb-input-btn').click();
            } else {
                const msg = primary[0].querySelector('.tb-input').value;
                var m = msg.toLowerCase();
                var _m = msg.split('');
                msg.split(' ').forEach((w) => {
                    if (this.#ProfaneList.includes(w.toLowerCase())) {
                        m = m.replaceAll(w.toLowerCase(), ('*').repeat(w.length));
                    }
                });
                var i = 0
                m.split('').forEach((c) => {
                    if (_m[i].toLowerCase() != c) {
                        _m[i] = "*"
                    }
                    i++
                });
                primary[0].querySelector('.tb-input').value = _m.join('');
            }
        });
        primary[0].querySelector('.tb-input-btn').addEventListener('click', () => {
            socket.emit('message', primary[0].querySelector('.tb-input').value)
            primary[0].querySelector('.tb-input').value = "";
        })
    }
    Message(nick, color, msg) {
        var m = msg.toLowerCase();
        var _m = msg.split('');
        msg.split(' ').forEach((w) => {
            if (this.#ProfaneList.includes(w.toLowerCase())) {
                m = m.replaceAll(w.toLowerCase(), ('*').repeat(w.length));
            }
        });
        var i = 0
        m.split('').forEach((c) => {
            if (_m[i].toLowerCase() != c) {
                _m[i] = "*"
            }
            i++
        });
        _m = _m.join('');
        this.#Primary[0].querySelector('.tb-chat').innerHTML += `<span style="color:${color == "white" ? 'grey' : color}">${nick}</span>: ${_m} <br>`;
        this.#Primary[0].querySelector('.tb-chat').scrollTop = this.#Primary[0].querySelector('.tb-chat').scrollHeight;
    }
    CreateWindow(title, body) {
        var Window = document.createElement('div');
        Window.innerHTML = `
        <div class="tb-window-header">
            <div class="tb-window-header-inner">
                ${title}
            </div>
            <div class="tb-window-btn">
                x
            </div>
        </div>
        <div class="tb-window-inner">
            ${body || ""}
        </div>`;
        function CloseWindow() {
            Window.remove();
        }
        Window.classList = "tb-window";
        if (!!document.querySelector('.tb-invisible')) {
            Window.classList.add('tb-invisible')
        }
        //Window.style = `top: -1000; left: -1000;`;
        document.body.appendChild(Window);
        var WindowOffset = {
            x: 0,
            y: 0
        };
        var WindowBoundingBoxes = Window.getBoundingClientRect();
        var WindowBeingHeld = false;
        Window.addEventListener('mousedown', (e) => {
            WindowBeingHeld = true;
            WindowBoundingBoxes = Window.getBoundingClientRect();
            WindowOffset = {
                x: WindowBoundingBoxes.left - e.clientX,
                y: WindowBoundingBoxes.top - e.clientY
            }
        });
        document.addEventListener('mousemove', (e) => {
            if (!WindowBeingHeld) {
                return;
            }
            Window.style.top = e.clientY + WindowOffset.y
            Window.style.left = e.clientX + WindowOffset.x
        });
        document.addEventListener('mouseup', (e) => {
            WindowBeingHeld = false;
        });
        Window.querySelector('.tb-window-btn').addEventListener('click', () => {
            CloseWindow();
        });
        Window.style = `top: ${(window.innerHeight / 2) - (WindowBoundingBoxes.height / 2)}; left: ${(window.innerWidth / 2) - (WindowBoundingBoxes.width / 2)}`
        return [Window, CloseWindow];
    }
    #Socket;
    #Nickname = "Anonymous";
    #Color = "red";
    #Primary;
    #ProfaneList;
};
var TabIsBeingHeld = false;
document.addEventListener('keydown', (e) => {
    if (e.key == "\\" && !!document.querySelector('.tb-window')) {
        if (TabIsBeingHeld) {
            return;
        }
        TabIsBeingHeld = true;
        setTimeout(() => {
            if (TabIsBeingHeld) {
                document.querySelectorAll('.tb-window').forEach((w) => {
                    w.classList.toggle('tb-invisible');
                })
            }
        }, 250);
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key == "\\") {
        TabIsBeingHeld = false;
    }
})