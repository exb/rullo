"use strict";

function dice_initialize(container) {
    const storage = window.localStorage;
    const name = storage.getItem('player_name');
    var ws;

    $t.remove($t.id('loading_text'));

    var canvas = $t.id('canvas');
    // canvas.style.width = window.innerWidth - 1 + 'px';
    // canvas.style.height = window.innerHeight - 1 + 'px';
    var set = $t.id('set');
    var info_div = $t.id('info_div');
    var notation_container = $t.id('notation_container');
    var roll_button = $t.id('roll_button');
    var player_board = $t.id('player_board');
    var roll_animation = $t.id('roll_animation');

    var logout = $t.id('logout');
    var join = $t.id('join');
    var join_player_name = $t.id('join_player_name');
    var join_button = $t.id('join_button');
    var wrapper = $t.id('wrapper');

    function joinRoom() {
        join.style.display = '';
        wrapper.style.display = 'none';
    }

    function playRoom() {
        join.style.display = 'none';
        wrapper.style.display = 'flex';
    }

    $t.dice.use_true_random = false;

    $t.bind(set, 'mousedown', function(ev) { ev.stopPropagation(); });
    $t.bind(set, 'mouseup', function(ev) { ev.stopPropagation(); });
    $t.bind(set, 'focus', function(ev) { $t.set(container, { class: '' }); });
    $t.bind(set, 'blur', function(ev) { $t.set(container, { class: 'noselect' }); });

    var params = $t.get_url_params();

    if (params.chromakey) {
        $t.dice.desk_color = 0x00ff00;
        $t.id('control_panel').style.display = 'none';
    }
    if (params.shadows == 0) {
        $t.dice.use_shadows = false;
    }
    if (params.color == 'white') {
        $t.dice.dice_color = '#808080';
        $t.dice.label_color = '#202020';
    }

    var box = new $t.dice.dice_box(canvas, { w: 500, h: 300 });
    box.animate_selector = false;

    $t.bind(window, 'resize', function() {
        // canvas.style.width = window.innerWidth - 1 + 'px';
        // canvas.style.height = window.innerHeight - 1 + 'px';
        box.reinit(canvas, { w: canvas.offsetWidth, h: canvas.offsetHeight });
    });

    function before_roll(vectors, notation, callback) {
        // do here rpc call or whatever to get your own result of throw.
        // then callback with array of your result, example:
        // callback([2, 2, 2, 2]); // for 4d6 where all dice values are 2.
        callback();
    }

    function notation_getter() {
        return $t.dice.parse_single_notation(set.value, [3]);
    }

    function after_roll(notation, result) {
        event(name, notation);
    }

    function hideControl() {
        notation_container.style.display = 'none';
        set.blur();
    }

    function showControl() {
        notation_container.style.display = '';
        setTimeout(() => {
            set.focus();
        }, 0);
    }

    function isControlShown() {
        return notation_container.style.display !== 'none';
    }

    function toggleControl() {
        if (!isControlShown()) {
            showControl();
        } else {
            hideControl();
        }
    }

    function event(player, response) {
        var roll_result = parseInt(response.result) + parseInt(response.constant);
        var dice = (response.set[0] || '').substring(1).trim();
        var bonus = '';

        if (response.constant) {
            if (response.constant > 0) bonus += '+' + response.constant;
            else bonus += '-' + Math.abs(response.constant);
        }

        var roll = document.createElement('div');
        roll.className = "player_roll shadow";
        roll.innerHTML = `
            <div class="player_name">
                ${player}
            </div>
            <div class="player_roll_result">
                <span>
                    ${roll_result}
                </span>
                <span class="player_roll_dice">
                    ${'/' + dice + bonus}
                </span>
            </div>
        `;

        player_board.prepend(roll)
    }

    // box.bind_mouse(container, notation_getter, before_roll, after_roll);
    // box.bind_throw($t.id('throw'), notation_getter, before_roll, after_roll);

    $t.bind(container, ['mouseup', 'touchend', 'keyup'], function(ev) {
        const ke = ev.type !== 'keyup' || ev.keyCode === 13;

        ev.stopPropagation();
        if (!box.rolling && ke) {
            // toggleControl();
        }
    });

    $t.bind(roll_button, ['mouseup', 'touchend'], function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        diceRoll();
    });

    $t.bind(logout, ['mouseup', 'touchend'], function(ev) {
        localStorage.removeItem('player_name');
        window.location.href = 'login.html';
    });

    $t.bind(player_board, ['mouseup', 'touchend'], function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    });

    $t.bind($t.id('set'), ['keyup'], function (evt) {
        if (evt.keyCode === 13) {
            evt.preventDefault();
            evt.stopPropagation();
            diceRoll();
            return;
        }

        var roll = $t.dice.parse_single_notation_ws(set.value);

        if (roll.error) {
            roll_button.classList.add('disabled');
            return;
        }

        if (!roll.error) {
            roll_button.classList.remove('disabled');
            return;
        }
    });

    function onMessage(evt) {
        var data = JSON.parse(evt.data);
        var player = data.name;
        var faces = data.faces;
        var bonus = data.bonus;
        var result = data.result;
        var bonus = data.bonus;
        const notation = { set: ['d' + faces], constant: bonus, result: [result - bonus], error: false };

        function notation_getter(response) {
            return notation;
        }

        if (player === name) {
            box.start_throw(notation_getter, before_roll, after_roll);
        } else {
            event(player, notation);
        }
    }

    function diceRoll() {
        if (box.rolling) {
            return;
        }

        var roll = $t.dice.parse_single_notation_ws(set.value);
        if (roll && !roll.error) {
            ws.send(JSON.stringify(roll.data));
        }
    }

    function reset() {
        box.clear();
        set.value = 'd20 + 3';
        player_board.innerHtml = '';
    }

    function init() {
        if (!name) {
            window.location.href = '/client/login.html';
            return;
        }

        var url = `wss://dicerz.herokuapp.com/ws?name=${name}`;
        ws = new WebSocket(url);
        ws.onmessage = onMessage;

        document.body.style.visibility = 'visible';
    }

    init();
}
