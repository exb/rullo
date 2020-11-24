"use strict";

function dice_initialize(container) {
    document.body.style.visibility = 'hidden';

    const storage = window.localStorage;
    const name = storage.getItem('player_name');

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
        return $t.dice.parse_notation(set.value);
    }

    function after_roll(notation, result) {
        event(name, result.join(' '));
        if (params.chromakey || params.noresult) return;
        var res = result.join(' ');
        if (notation.constant) {
            if (notation.constant > 0) res += ' +' + notation.constant;
            else res += ' -' + Math.abs(notation.constant);
        }
        if (result.length > 1) res += ' = ' +
                (result.reduce(function(s, a) { return s + a; }) + notation.constant);
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

    function event(player, roll_result) {
        var roll = document.createElement('div');
        roll.className = "player_roll shadow";
        roll.innerHTML = `
            <div class="player_name">
                ${player}
            </div>
            <div class="player_roll_result">
                ${roll_result}
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
        box.start_throw(notation_getter, before_roll, after_roll);
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
            box.start_throw(notation_getter, before_roll, after_roll);
        }
    });

    function reset() {
        box.clear();
        set.value = '4d6';
        player_board.innerHtml = '';
    }

    function init() {
        if (!name) {
            console.log('login', name);
            window.location.href = 'login.html';
            return;
        }

        document.body.style.visibility = 'visible';
        box.start_throw(notation_getter, before_roll, after_roll);
    }

    init();
}
