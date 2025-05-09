// Jazz Mafia Terminal JS
const terminalOutput = document.getElementById('terminal-output');
const terminalForm = document.getElementById('terminal-form');
const terminalInput = document.getElementById('terminal-input');

let currentUser = null;
let accessLevel = 1;

function printLine(text, cls = '') {
    const div = document.createElement('div');
    div.className = 'output-line ' + cls;
    div.innerHTML = text;
    terminalOutput.appendChild(div);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function jazzWelcome() {
    printLine('<span class="jazz">Welcome to the Jazz Mafia Terminal!</span>');
    printLine('<span class="mafia">Type "help" to see available commands.</span>');
}

function help() {
    printLine('Available commands:', 'jazz');
    printLine('<b>login [member]</b> - Login as a band member');
    printLine('<b>whoami</b> - Show current user');
    printLine('<b>members</b> - List all members');
    printLine('<b>access</b> - Show your access level');
    printLine('<b>jazzify</b> - Get a jazz quote');
    printLine('<b>clear</b> - Clear the terminal');
}

function clearTerminal() {
    terminalOutput.innerHTML = '';
}

function jazzify() {
    const quotes = [
        'It don\'t mean a thing if it ain\'t got that swing.',
        'The real power of music is that it can reach inside and touch the soul.',
        'Jazz is the big brother of Revolution. Revolution follows it around.',
        'If you have to ask what jazz is, you\'ll never know.'
    ];
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    printLine('<span class="jazz">🎷 ' + q + '</span>');
}

async function listMembers() {
    try {
        const res = await fetch('members/members.json');
        const members = await res.json();
        printLine('Band Members:', 'jazz');
        members.forEach(m => printLine(`- <b>${m.name}</b> (access: <span class="access-${m.access}">${m.access}</span>)`));
    } catch {
        printLine('Could not load members.', 'mafia');
    }
}

async function login(memberName) {
    try {
        const res = await fetch(`members/${memberName}.json`);
        if (!res.ok) throw new Error();
        const member = await res.json();
        currentUser = member.name;
        accessLevel = member.access;
        printLine(`Welcome, <b>${member.name}</b>! Your access level is <span class="access-${accessLevel}">${accessLevel}</span>.`, `access-${accessLevel}`);
    } catch {
        printLine('Login failed. Member not found.', 'mafia');
    }
}

function whoami() {
    if (currentUser) {
        printLine(`You are <b>${currentUser}</b> (access: <span class="access-${accessLevel}">${accessLevel}</span>)`);
    } else {
        printLine('Not logged in.', 'mafia');
    }
}

function showAccess() {
    printLine(`Your access level is <span class="access-${accessLevel}">${accessLevel}</span>.`);
}

terminalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = terminalInput.value.trim();
    printLine(`<span class="prompt">jazz-mafia$</span> ${input}`);
    terminalInput.value = '';
    const [cmd, ...args] = input.split(' ');
    switch (cmd) {
        case 'help': help(); break;
        case 'clear': clearTerminal(); break;
        case 'jazzify': jazzify(); break;
        case 'members': await listMembers(); break;
        case 'login': await login(args[0]); break;
        case 'whoami': whoami(); break;
        case 'access': showAccess(); break;
        case '': break;
        default:
            printLine('Unknown command. Type "help".', 'mafia');
    }
});

window.onload = jazzWelcome;
