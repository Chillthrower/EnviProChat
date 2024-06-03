import React, { useState, useEffect } from 'react';
import client, { databases, DATABASE_ID, COLLECTION_ID_MESSAGES, COLLECTION_ID_CHANNELS } from '../appwriteConfig';
import { ID, Query, Permission, Role } from 'appwrite';
import Header from '../components/Header';
import { useAuth } from '../utils/AuthContext';
import { Trash2 } from 'react-feather';
import Sidebar from '../components/Sidebar';

const Room = () => {
    const [messageBody, setMessageBody] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentChannel, setCurrentChannel] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (currentChannel) {
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_ID_MESSAGES,
                    [
                        Query.equal('channel_id', currentChannel.$id),
                        Query.orderDesc('$createdAt'),
                        Query.limit(100),
                    ]
                );
                setMessages(response.documents);
            }
        };

        fetchData();

        const unsubscribe = client.subscribe(
            `databases.${DATABASE_ID}.collections.${COLLECTION_ID_MESSAGES}.documents`,
            response => {
                if (
                    currentChannel &&
                    response.events.includes(
                        "databases.*.collections.*.documents.*.create"
                    ) &&
                    response.payload.channel_id === currentChannel.$id
                ) {
                    // Update messages state only if the new message belongs to the current channel
                    setMessages(prevState => [response.payload, ...prevState]);
                }
                if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
                    // Handle message deletion if needed
                    setMessages(prevState =>
                        prevState.filter(message => message.$id !== response.payload.$id)
                    );
                }
            }
        );

        return () => {
            unsubscribe();
        };
    }, [currentChannel]);

    const getMessages = async () => {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_MESSAGES,
            [
                Query.equal("channel_id", currentChannel.$id),
                Query.orderDesc("$createdAt"),
                Query.limit(100),
            ]
        );
        setMessages(response.documents);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const permissions = [
            Permission.write(Role.user(user.$id)),
        ];
        const payload = {
            user_id: user.$id,
            username: user.name,
            body: messageBody,
            channel_id: currentChannel.$id,
        };
        const response = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID_MESSAGES,
            ID.unique(),
            payload,
            permissions
        );
        setMessageBody('');
        
        // Manually update the messages state with the newly created message
        setMessages(prevState => [response, ...prevState]);
    };

    const deleteMessage = async (id) => {
        try {
            await databases.deleteDocument(DATABASE_ID, COLLECTION_ID_MESSAGES, id);
            setMessages(prevState => prevState.filter(message => message.$id !== id));
        } catch (error) {
            console.error('Failed to delete message:', error.message);
        }
    };

    return (
        <div className="chat-app">
            <Sidebar setCurrentChannel={setCurrentChannel} />
            <main className="container">
                <Header />
                <div className="room--container">
                    {currentChannel ? (
                        <>
                            <h2>Channel: {currentChannel.name}</h2>
                            <form id="message--form" onSubmit={handleSubmit}>
                                <div>
                                    <textarea
                                        required
                                        maxLength="250"
                                        placeholder="Say something..."
                                        onChange={(e) => setMessageBody(e.target.value)}
                                        value={messageBody}
                                    ></textarea>
                                </div>
                                <div className="send-btn--wrapper">
                                    <input className="btn btn--secondary" type="submit" value="send" />
                                </div>
                            </form>
                            <div className="chat-container">
                                {messages.map((message, index) => (
                                    <div key={message.$id || index} className={"message--wrapper"}>
                                        <div className="message--header">
                                            <p>
                                                {message?.username ? (
                                                    <span> {message?.username}</span>
                                                ) : (
                                                    'Anonymous user'
                                                )}
                                                <small className="message-timestamp"> {new Date(message.$createdAt).toLocaleString()}</small>
                                            </p>
                                            {message.$permissions.includes(`delete("user:${user.$id}")`) && (
                                                <Trash2 className="delete--btn" onClick={() => deleteMessage(message.$id)} />
                                            )}
                                        </div>
                                        <div className={"message--body" + (message.user_id === user.$id ? ' message--body--owner' : '')}>
                                            <span>{message.body}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p>Please select a channel.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Room;
