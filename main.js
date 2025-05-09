// Jazz Mafia Terminal JS
const terminalOutput = document.getElementById('terminal-output');
const terminalForm = document.getElementById('terminal-form');
const terminalInput = document.getElementById('terminal-input');

let currentUser = null;
let accessLevel = 1;
let missions = [];
let isLoggedIn = false;
let memberData = null;

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
    printLine('<b>login [member] [password]</b> - Login as a band member');
    printLine('<b>whoami</b> - Show current user');
    printLine('<b>members</b> - List all members');
    printLine('<b>access</b> - Show your access level');
    printLine('<b>missions</b> - List all missions');
    printLine('<b>mission [id]</b> - Show mission details');
    printLine('<b>jazzify</b> - Get a jazz quote');
    printLine('<b>clear</b> - Clear the terminal');
    printLine('<b>logout</b> - Log out');
    printLine('<b>assign [id] [member]</b> - Assign a mission (access 4+)');
    printLine('<b>complete [id]</b> - Mark mission complete (access 3+)');
    printLine('<b>secrethq</b> - Enter secret HQ (access 5 only)');
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

async function fetchMissions() {
    try {
        const res = await fetch('members/missions.json');
        missions = await res.json();
    } catch {
        missions = [];
    }
}

function printMissions() {
    if (!missions.length) {
        printLine('No missions found.', 'mafia');
        return;
    }
    printLine('Missions:', 'jazz');
    missions.forEach(m => {
        printLine(`<b>[${m.id}]</b> ${m.title} - <i>${m.status}</i><br><span style='margin-left:2em'>${m.description}</span>`);
    });
}

function printMission(id) {
    const m = missions.find(m => m.id == id);
    if (!m) {
        printLine('Mission not found.', 'mafia');
        return;
    }
    printLine(`<b>${m.title}</b> - <i>${m.status}</i><br>${m.description}`);
}

function requireAccess(level, action) {
    if (accessLevel < level) {
        printLine('Access denied. Higher clearance required.', 'mafia');
        return false;
    }
    return true;
}

async function login(memberName, password) {
    try {
        const res = await fetch(`members/${memberName}.json`);
        if (!res.ok) throw new Error();
        const member = await res.json();
        if (member.password !== password) {
            printLine('Login failed. Incorrect password.', 'mafia');
            return;
        }
        currentUser = member.name;
        accessLevel = member.access;
        isLoggedIn = true;
        memberData = member;
        printLine(`Welcome, <b>${member.name}</b>! Your access level is <span class="access-${accessLevel}">${accessLevel}</span>.`, `access-${accessLevel}`);
        await fetchMissions();
    } catch {
        printLine('Login failed. Member not found.', 'mafia');
    }
}

function logout() {
    currentUser = null;
    accessLevel = 1;
    isLoggedIn = false;
    memberData = null;
    printLine('Logged out.', 'mafia');
}

function assignMission(id, member) {
    if (!requireAccess(4)) return;
    const m = missions.find(m => m.id == id);
    if (!m) {
        printLine('Mission not found.', 'mafia');
        return;
    }
    m.status = `assigned to ${member}`;
    printLine(`Mission [${id}] assigned to ${member}.`, 'jazz');
}

function completeMission(id) {
    if (!requireAccess(3)) return;
    const m = missions.find(m => m.id == id);
    if (!m) {
        printLine('Mission not found.', 'mafia');
        return;
    }
    m.status = 'complete';
    printLine(`Mission [${id}] marked as complete.`, 'jazz');
}

function secretHQ() {
    if (!requireAccess(5)) return;
    printLine('<span class="mafia">Welcome to the secret HQ, boss. The city is yours tonight.</span>');
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
        case 'login': await login(args[0], args[1]); break;
        case 'whoami': whoami(); break;
        case 'access': showAccess(); break;
        case 'missions': printMissions(); break;
        case 'mission': printMission(args[0]); break;
        case 'logout': logout(); break;
        case 'assign': assignMission(args[0], args[1]); break;
        case 'complete': completeMission(args[0]); break;
        case 'secrethq': secretHQ(); break;
        case '': break;
        default:
            printLine('Unknown command. Type "help".', 'mafia');
    }
});

window.onload = jazzWelcome;
