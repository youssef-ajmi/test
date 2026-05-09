// Notes App

const NotesApp = {
    window: null,
    notes: [],
    currentNote: null,
    
    async open() {
        if (this.window) {
            WindowManager.restoreWindow(this.window);
            return;
        }
        
        await this.loadNotes();
        
        const content = `
            <div class="notes-window" style="display: flex; height: 100%;">
                <div class="notes-list" id="notes-list"></div>
                <div class="notes-editor">
                    <div class="notes-toolbar">
                        <button onclick="NotesApp.createNote()">+ New Note</button>
                        <button onclick="NotesApp.deleteNote()" style="background: var(--danger-color);">Delete</button>
                    </div>
                    <textarea id="notes-textarea" placeholder="Start typing..." oninput="NotesApp.noteChanged(this.value)"></textarea>
                </div>
            </div>
        `;
        
        this.window = WindowManager.createWindow('Notes', content, {
            width: 700,
            height: 500
        });
        
        this.renderNotesList();
    },
    
    async loadNotes() {
        // Load notes from localStorage
        const saved = localStorage.getItem('webdesk-notes');
        if (saved) {
            this.notes = JSON.parse(saved);
        } else {
            // Create default note
            this.notes = [{
                id: Date.now(),
                title: 'Welcome to Notes',
                content: 'This is your first note.\n\nStart typing to edit!',
                modified: new Date().toISOString()
            }];
            this.saveNotes();
        }
    },
    
    saveNotes() {
        localStorage.setItem('webdesk-notes', JSON.stringify(this.notes));
    },
    
    renderNotesList() {
        const list = document.getElementById('notes-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        this.notes.sort((a, b) => new Date(b.modified) - new Date(a.modified));
        
        this.notes.forEach(note => {
            const item = document.createElement('div');
            item.className = 'note-item' + (note.id === this.currentNote ? ' active' : '');
            item.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 4px;">${note.title || 'Untitled'}</div>
                <div style="font-size: 11px; color: var(--text-secondary);">${new Date(note.modified).toLocaleDateString()}</div>
            `;
            item.addEventListener('click', () => this.selectNote(note.id));
            list.appendChild(item);
        });
    },
    
    selectNote(id) {
        this.currentNote = id;
        const note = this.notes.find(n => n.id === id);
        
        if (note) {
            const textarea = document.getElementById('notes-textarea');
            if (textarea) {
                textarea.value = note.content;
            }
        }
        
        this.renderNotesList();
    },
    
    createNote() {
        const newNote = {
            id: Date.now(),
            title: 'New Note',
            content: '',
            modified: new Date().toISOString()
        };
        
        this.notes.unshift(newNote);
        this.saveNotes();
        this.currentNote = newNote.id;
        this.renderNotesList();
        
        const textarea = document.getElementById('notes-textarea');
        if (textarea) {
            textarea.value = '';
            textarea.focus();
        }
    },
    
    deleteNote() {
        if (!this.currentNote) return;
        
        if (!confirm('Delete this note?')) return;
        
        this.notes = this.notes.filter(n => n.id !== this.currentNote);
        this.saveNotes();
        
        if (this.notes.length > 0) {
            this.currentNote = this.notes[0].id;
            this.selectNote(this.currentNote);
        } else {
            this.currentNote = null;
            const textarea = document.getElementById('notes-textarea');
            if (textarea) textarea.value = '';
        }
        
        this.renderNotesList();
    },
    
    noteChanged(content) {
        if (!this.currentNote) return;
        
        const note = this.notes.find(n => n.id === this.currentNote);
        if (note) {
            note.content = content;
            note.modified = new Date().toISOString();
            
            // Update title from first line
            const firstLine = content.split('\n')[0].slice(0, 30);
            note.title = firstLine || 'Untitled';
            
            this.saveNotes();
            this.renderNotesList();
        }
    },
    
    close() {
        if (this.window) {
            WindowManager.closeWindow(this.window);
            this.window = null;
        }
    }
};

window.NotesApp = NotesApp;
