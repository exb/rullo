function init() {
    const login = document.getElementById('join_button');
    const player_name = document.getElementById('join_player_name');

    login.addEventListener('mouseup', function () {
        const name = (player_name.value || '').trim();

        if (!name) {
            return;
        }

        localStorage.setItem('player_name', name);

        window.location.href = 'index.html';
    });
}
