// Jazz Mafia Terminal JS
const terminalOutput = document.getElementById('terminal-output');
const terminalForm = document.getElementById('terminal-form');
const terminalInput = document.getElementById('terminal-input');

let currentUser = null;
let accessLevel = 1;
let missions = [];
let isLoggedIn = false;
let memberData = null;
let commandHistory = [];
let historyIndex = -1;

// --- Supabase Setup ---
const SUPABASE_URL = 'https://uznkkjczakyyinzhmoll.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bmtramN6YWt5eWluemhtb2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDAyODksImV4cCI6MjA2MjM3NjI4OX0.huw9uasQL8dmS8xfgpZaRfVc-nuy5eMhl6jrE25g5k0';

async function supabaseFetch(table, method = 'GET', body = null, query = '') {
    // Always use https, never postgresql://
    const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
    const options = {
        method,
        headers: {
            'apikey': SUPABASE_API_KEY,
            'Authorization': `Bearer ${SUPABASE_API_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            // CORS fix: allow cross-origin
            'Accept': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);
    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            const err = await res.text();
            throw new Error('Supabase error: ' + err);
        }
        return await res.json();
    } catch (e) {
        printLine('Connection error: ' + e.message, 'mafia');
        return [];
    }
}

// --- Signup & Application ---
async function signup(name, password, instrument, bio) {
    // Send application to Benson (access 5, role Boss)
    const application = {
        name,
        password,
        instrument,
        bio,
        status: 'pending',
        requested_at: new Date().toISOString()
    };
    try {
        await supabaseFetch('applications', 'POST', application);
        printLine('Application submitted. Await approval from the Boss (Benson).', 'jazz');
    } catch {
        printLine('Failed to submit application.', 'mafia');
    }
}

// --- Application Approval (for Benson) ---
async function listApplications() {
    if (!requireAccess(5)) return;
    try {
        const apps = await supabaseFetch('applications');
        if (!apps.length) {
            printLine('No pending applications.', 'jazz');
            return;
        }
        printLine('Pending Applications:', 'jazz');
        apps.forEach(a => printLine(`<b>${a.name}</b> (${a.instrument}) - ${a.bio} [${a.status}]`));
    } catch {
        printLine('Could not load applications.', 'mafia');
    }
}

async function approveApplication(name, access = 1, role = 'Associate') {
    if (!requireAccess(5)) return;
    try {
        // Get application
        const apps = await supabaseFetch('applications', 'GET', null, `?name=eq.${name}&status=eq.pending`);
        if (!apps.length) {
            printLine('No such pending application.', 'mafia');
            return;
        }
        const app = apps[0];
        // Add to members
        await supabaseFetch('members', 'POST', {
            name: app.name,
            password: app.password,
            instrument: app.instrument,
            bio: app.bio,
            access,
            role
        });
        // Mark application as approved
        await supabaseFetch('applications', 'PATCH', { status: 'approved' }, `?name=eq.${name}`);
        printLine(`Application for ${name} approved and added as member.`, 'jazz');
    } catch {
        printLine('Failed to approve application.', 'mafia');
    }
}

// --- Member Management ---
async function createMember(name, password, instrument, bio, access = 1, role = 'Associate') {
    if (!requireAccess(5)) return;
    try {
        await supabaseFetch('members', 'POST', { name, password, instrument, bio, access, role });
        printLine(`Member ${name} created.`, 'jazz');
    } catch {
        printLine('Failed to create member.', 'mafia');
    }
}

async function removeMember(name) {
    if (!requireAccess(5)) return;
    try {
        await supabaseFetch('members', 'DELETE', null, `?name=eq.${name}`);
        printLine(`Member ${name} removed.`, 'jazz');
    } catch {
        printLine('Failed to remove member.', 'mafia');
    }
}

// --- Mission Management ---
async function createMission(title, description) {
    if (!requireAccess(4)) return;
    try {
        await supabaseFetch('missions', 'POST', { title, description, status: 'pending' });
        printLine(`Mission '${title}' created.`, 'jazz');
        await fetchMissions();
    } catch {
        printLine('Failed to create mission.', 'mafia');
    }
}

async function removeMission(id) {
    if (!requireAccess(4)) return;
    try {
        await supabaseFetch('missions', 'DELETE', null, `?id=eq.${id}`);
        printLine(`Mission [${id}] removed.`, 'jazz');
        await fetchMissions();
    } catch {
        printLine('Failed to remove mission.', 'mafia');
    }
}

// --- Helper Management ---
async function addHelper(name, type, contact, notes) {
    if (!requireAccess(5)) return;
    try {
        await supabaseFetch('helpers', 'POST', { name, type, contact, notes });
        printLine(`Helper '${name}' (${type}) added.`, 'jazz');
    } catch {
        printLine('Failed to add helper.', 'mafia');
    }
}

async function listHelpers() {
    if (!requireAccess(4)) return;
    try {
        const helpers = await supabaseFetch('helpers');
        if (!helpers.length) {
            printLine('No helpers found.', 'jazz');
            return;
        }
        printLine('Helpers:', 'jazz');
        helpers.forEach(h => printLine(`<b>${h.name}</b> (${h.type}) - ${h.contact || 'no contact'}<br><span style='margin-left:2em'>${h.notes || ''}</span>`));
    } catch {
        printLine('Could not load helpers.', 'mafia');
    }
}

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
    printLine('<b>signup [name] [password] [instrument] [bio]</b> - Apply to join the band');
    printLine('<b>whoami</b> - Show current user');
    printLine('<b>members</b> - List all members');
    printLine('<b>access</b> - Show your access level');
    printLine('<b>jazzify</b> - Get a jazz quote');
    printLine('<b>clear</b> - Clear the terminal');
    if (accessLevel >= 2) printLine('<b>missions</b> - List all missions');
    if (accessLevel >= 2) printLine('<b>mission [id]</b> - Show mission details');
    if (accessLevel >= 3) printLine('<b>complete [id]</b> - Mark mission complete');
    if (accessLevel >= 4) {
        printLine('<b>assign [id] [member]</b> - Assign a mission');
        printLine('<b>createmission [title] [desc]</b> - Create a mission');
        printLine('<b>removemission [id]</b> - Remove a mission');
        printLine('<b>helpers</b> - List helpers');
    }
    if (accessLevel >= 5) {
        printLine('<b>secrethq</b> - Enter secret HQ');
        printLine('<b>applications</b> - List applications');
        printLine('<b>approve [name] [access] [role]</b> - Approve application');
        printLine('<b>createmember [name] [password] [instrument] [bio] [access] [role]</b> - Create member');
        printLine('<b>removemember [name]</b> - Remove member');
        printLine('<b>addhelper [name] [type] [contact] [notes]</b> - Add a helper (funder, supplier, etc)');
    }
    printLine('<b>logout</b> - Log out');
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
        const members = await supabaseFetch('members');
        printLine('Band Members:', 'jazz');
        members.forEach(m => printLine(`- <b>${m.name}</b> (access: <span class="access-${m.access}">${m.access}</span>)`));
    } catch {
        printLine('Could not load members.', 'mafia');
    }
}

async function fetchMissions() {
    try {
        missions = await supabaseFetch('missions');
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
        const members = await supabaseFetch('members', 'GET', null, `?name=eq.${memberName}`);
        if (!members.length) throw new Error();
        const member = members[0];
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
    // Live update (optimistic UI)
    m.status = `assigned to ${member}`;
    printLine(`Mission [${id}] assigned to ${member}.`, 'jazz');
    // Update in Supabase
    supabaseFetch('missions', 'PATCH', { status: `assigned to ${member}` }, `?id=eq.${id}`);
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
    supabaseFetch('missions', 'PATCH', { status: 'complete' }, `?id=eq.${id}`);
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

terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        if (commandHistory.length === 0) return;
        if (historyIndex === -1) historyIndex = commandHistory.length - 1;
        else if (historyIndex > 0) historyIndex--;
        terminalInput.value = commandHistory[historyIndex];
        e.preventDefault();
    } else if (e.key === 'ArrowDown') {
        if (commandHistory.length === 0) return;
        if (historyIndex === -1) return;
        if (historyIndex < commandHistory.length - 1) historyIndex++;
        else { historyIndex = -1; terminalInput.value = ''; return; }
        terminalInput.value = commandHistory[historyIndex];
        e.preventDefault();
    }
});

terminalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = terminalInput.value.trim();
    if (input) {
        commandHistory.push(input);
        if (commandHistory.length > 100) commandHistory.shift();
    }
    historyIndex = -1;
    printLine(`<span class="prompt">jazz-mafia$</span> ${input}`);
    terminalInput.value = '';
    const [cmd, ...args] = input.split(' ');
    switch (cmd) {
        case 'help': help(); break;
        case 'clear': clearTerminal(); break;
        case 'jazzify': jazzify(); break;
        case 'members': await listMembers(); break;
        case 'login': await login(args[0], args[1]); break;
        case 'signup': await signup(args[0], args[1], args[2], args.slice(3).join(' ')); break;
        case 'whoami': whoami(); break;
        case 'access': showAccess(); break;
        case 'missions': printMissions(); break;
        case 'mission': printMission(args[0]); break;
        case 'logout': logout(); break;
        case 'assign': assignMission(args[0], args[1]); break;
        case 'complete': completeMission(args[0]); break;
        case 'secrethq': secretHQ(); break;
        case 'applications': await listApplications(); break;
        case 'approve': await approveApplication(args[0], Number(args[1]) || 1, args[2] || 'Associate'); break;
        case 'createmember': await createMember(args[0], args[1], args[2], args[3], Number(args[4]) || 1, args[5] || 'Associate'); break;
        case 'removemember': await removeMember(args[0]); break;
        case 'createmission': await createMission(args[0], args.slice(1).join(' ')); break;
        case 'removemission': await removeMission(args[0]); break;
        case 'addhelper': await addHelper(args[0], args[1], args[2], args.slice(3).join(' ')); break;
        case 'helpers': await listHelpers(); break;
        case '': break;
        default:
            printLine('Unknown command. Type "help".', 'mafia');
    }
});

window.onload = jazzWelcome;
