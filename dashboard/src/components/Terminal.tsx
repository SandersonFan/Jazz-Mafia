import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { User as SupabaseUser } from '@supabase/auth-js';
import styles from './Terminal.module.css';

interface TerminalProps {
  onAuthChange: (user: SupabaseUser | null) => void;
  user: SupabaseUser | null;
}

// Define a type for messages fetched from the database
interface ChatMessageFromDB {
  id: number;
  created_at: string;
  user: string;
  body: string;
}

const initialMessages = [
  'Welcome to the Jazz Band Mafia Terminal Dash!',
  'Type help to see available commands.'
];

export const Terminal: React.FC<TerminalProps> = ({ onAuthChange, user }) => {
  const [messages, setMessages] = useState<string[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [messages]);

  // Helper to print to terminal
  const print = (output: string) => setMessages(msgs => [...msgs, output]);

  // Helper to print chat messages
  const printChat = (user: string, body: string) => setMessages(msgs => [...msgs, `[msg] ${user}: ${body}`]);

  // Improved login/signup logic and intuitive commands
  const handleCommand = async (cmd: string) => {
    const args = cmd.trim().split(/\s+/);
    const command = args[0]?.toLowerCase();
    setLoading(true);
    switch (command) {
      case 'help':
        print('Commands: signup <email> <password> <username>, login <email> <password>, logout, whoami, jobs, members, heist, approve <email>, msg <message>, messages, clear, help');
        break;
      case 'signup':
        if (args.length !== 4) {
          print('Usage: signup <email> <password> <username>');
          break;
        }
        {
          const email = args[1];
          const password = args[2];
          const username = args[3];
          // Sign up with Supabase Auth
          const { error: authError } = await supabase.auth.signUp({
            email,
            password
          });
          if (authError) {
            print(`Signup error: ${authError.message}`);
            break;
          }
          // Insert into users table for approval workflow
          const { error: userError } = await supabase.from('users').insert([
            { email, username, status: 'pending', access_level: 0 }
          ]);
          if (userError) {
            print(`Signup error: ${userError.message}`);
            break;
          }
          print('Signup request sent. Awaiting approval.');
        }
        break;
      case 'login':
        if (args.length !== 3) {
          print('Usage: login <email> <password>');
          break;
        }
        {
          const email = args[1];
          const password = args[2];
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) print(`Login error: ${error.message}`);
          else if (data.user) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('status,username')
              .eq('email', email)
              .single();
            if (userError) print('Login failed: user not found in mafia database.');
            else if (userData.status !== 'approved') print('Your account is pending approval by a mafia boss.');
            else {
              onAuthChange(data.user);
              print(`Welcome, ${userData.username || data.user.email}!`);
            }
          }
        }
        break;
      case 'logout':
        await supabase.auth.signOut();
        onAuthChange(null);
        print('Logged out.');
        break;
      case 'whoami':
        if (!user) print('Not logged in.');
        else print(`Logged in as: ${user?.email ?? 'unknown'}`);
        break;
      case 'clear':
        setMessages([]);
        break;
      case 'jobs':
        print('Current jobs: [bank-heist, jazz-gig, speakeasy-protection]');
        break;
      case 'members':
        print('Mafia members: [Don, Consigliere, Capo, Soldier, Associate, Benson]');
        break;
      case 'heist':
        print('Heist in progress... (just kidding)');
        break;
      case 'approve':
        if (!user) {
          print('You must be logged in as a boss to approve.');
          break;
        }
        if (args.length !== 2) {
          print('Usage: approve <user_email>');
          break;
        }
        {
          const { data: mafiaUser } = await supabase
            .from('users')
            .select('access_level')
            .eq('email', user?.email ?? '')
            .single();
          if (!mafiaUser || mafiaUser.access_level < 5) {
            print('Only bosses can approve.');
            break;
          }
          const emailToApprove = args[1];
          const { data: userToApprove, error: err } = await supabase
            .from('users')
            .select('id,status')
            .eq('email', emailToApprove)
            .single();
          if (err || !userToApprove) {
            print('User not found.');
            break;
          }
          if (userToApprove.status === 'approved') {
            print('User already approved.');
            break;
          }
          const { error: updateErr } = await supabase
            .from('users')
            .update({ status: 'approved' })
            .eq('id', userToApprove.id);
          if (updateErr) print('Approval failed.');
          else print(`User ${emailToApprove} approved!`);
        }
        break;
      case 'msg':
        if (!user) {
          print('You must be logged in to send messages.');
          break;
        }
        if (args.length < 2) {
          print('Usage: msg <message>');
          break;
        }
        {
          const message = cmd.slice(4).trim();
          const username = user?.email ? user.email.split('@')[0] : 'unknown';
          await supabase.from('messages').insert([{ user: username, body: message }]);
          printChat(username, message);
        }
        break;
      case 'messages':
        const { data: msgs, error: msgErr } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (msgErr) print('Failed to fetch messages.');
        else if (msgs) {
          (msgs as ChatMessageFromDB[]).reverse().forEach((m) => printChat(m.user, m.body));
        }
        break;
      default:
        print(`Unknown command: ${cmd}`);
    }
    setLoading(false);
    setMessages(msgs => [...msgs, `$ ${cmd}`]);
  };

  const handleInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      handleCommand(input.trim());
      setInput('');
    }
  };

  return (
    <div className={styles.fullscreenTerminal} onClick={() => inputRef.current?.focus()}>
      <div className={styles.terminalWindow}>
        {messages.map((msg, i) => (
          <div key={i} className={styles.terminalLine}>{msg}</div>
        ))}
        <form onSubmit={handleInput} className={styles.terminalForm} autoComplete="off">
          <span className={styles.prompt}>$</span>
          <input
            ref={inputRef}
            className={styles.terminalInput}
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
            spellCheck={false}
            disabled={loading}
          />
        </form>
      </div>
    </div>
  );
};
