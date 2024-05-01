import React, { useEffect, useState } from 'react';
import './style.css'
import bridge from '@vkontakte/vk-bridge';

export default function App() {
  const [listNotes, setListNotes] = useState([]);
  const [count, setCount] = useState(0);
  const [vkuser, setVkUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [modalErr, setModalErr] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editText, setEditText] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await bridge.send("VKWebAppStorageGet", { keys: ["notesData"] });
        const storedData = data.keys[0].value;

        if (storedData) {
          const { count, listNotes } = JSON.parse(storedData);
          setCount(count);
          setListNotes(listNotes);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData();
  }, []);

  const saveData = async (count, listNotes) => {
    try {
      await bridge.send("VKWebAppStorageSet", {
        key: "notesData",
        value: JSON.stringify({ count, listNotes }),
      });
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const addNote = () => {
    const text = noteText.trim();
    if (text === '') {
      setModalErr(true);
      return;
    }

    if (isEditing) {
      const updatedNotes = [...listNotes];
      updatedNotes[editIndex] = { ...updatedNotes[editIndex], text: text };
      setListNotes(updatedNotes);
      setEditIndex(null);
      setIsEditing(false);
    } else {
      setListNotes([...listNotes, { id: Date.now(), text: text }]);
      setCount(count + 1);
    }

    setCharCount(0);
    setIsOpen(false);
    setModalErr(false);
    setNoteText('');
    saveData(count, listNotes); 
  };

  const deleteNote = (id) => {
    setListNotes(listNotes.filter((note) => note.id !== id));
    setCount(count - 1);
    saveData(count - 1, listNotes.filter((note) => note.id !== id)); 
  };

  const openEditModal = (index, text) => {
    setEditIndex(index);
    setEditText(text);
    setIsOpen(true);
    setIsEditing(true); 
  };
  

  useEffect(() => {
    async function fetchUser () {
      const user = await bridge.send('VKWebAppGetUserInfo')
      setVkUser(user)
    }
    fetchUser()
  }, [])

  const openModal = () =>{
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setCharCount(0)
    setNoteText('')
  }

  useEffect(() => {
    let timer;
    if (modalErr) {
      timer = setTimeout(() => {
        setModalErr(false);
      }, 3000);
    }
    return () => clearTimeout(timer); 
  }, [modalErr]);

  return (
    <>
      <header className='header'>
        <h1 className='main-title' >
          Заметки
        </h1>
        <div className='info-block-header'>
          <h2>
            Количество заметок: {count}
          </h2>
        </div>    
      </header>

      <div>
        <div className="subheader">
          <h2 className="subtitle">Список:</h2>
          <button className="button-add" onClick={() => openModal ()}>
            Добавить
          </button>
        </div>

        {isOpen && (
          <div className='overlay'>
            <div className='modal-window'>
              <h2 className='title-modal'>
                  Ваша заметка
              </h2>
              <h3 className='subtitle-modal'>Текст вашей заметки:</h3>
              <textarea
                  placeholder='Введите текст'
                  maxLength={100}
                  value={noteText}
                  onChange={(e) => {
                    setNoteText(e.target.value);
                    setCharCount(e.target.value.length);
                  }}
                ></textarea>
                <div className='char-count'>Символов: {charCount}/100</div>

              <div className='buttons-block'>
                <button className='close-modal-button'  onClick={closeModal}>Отменить</button>
                <button
                  className='add-note-button'
                  onClick={() => addNote()}
                >
                  {isEditing ? 'Изменить' : 'Добавить'}
                </button>
                
              </div>
              {modalErr && (
                  <h2 className='error-text'>Введите текст!!!</h2>
                )}

            </div>
          </div>
        )}

        <div className='container-notes'>
          <ul className='list-notes'>
            {listNotes.map((note, index) => (
              <li key={note.id} className='item-list'>
                <span className='title-note'>{note.text}</span>
                <button className="button" onClick={() => deleteNote(note.id)}>
                  Удалить
                </button>
                <button className="button" onClick={() => openEditModal(index, note.text)}>
                  Редактировать
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
