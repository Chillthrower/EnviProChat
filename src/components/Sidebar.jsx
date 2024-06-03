// Sidebar.js
import React, { useState, useEffect } from 'react';
import { databases, DATABASE_ID, COLLECTION_ID_CHANNELS } from '../appwriteConfig';
import { ID, Query } from 'appwrite';
import { useAuth } from '../utils/AuthContext';

const Sidebar = ({ setCurrentChannel }) => {
    const [channels, setChannels] = useState([]);
    const [channelName, setChannelName] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        getChannels();
    }, []);

    const getChannels = async () => {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_CHANNELS,
            [Query.orderDesc('$createdAt')]
        );
        setChannels(response.documents);
    };

    const createChannel = async (e) => {
        e.preventDefault();
        const currentTime = new Date().toISOString(); // Get current timestamp
        const payload = {
            name: channelName,
            created_at: currentTime, // Include the created_at attribute
            created_by: user.$id // Include the ID of the user creating the channel
        };
        const response = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID_CHANNELS,
            ID.unique(),
            payload
        );
        setChannels(prevState => [response, ...prevState]);
        setChannelName('');
    };
    

    const deleteChannel = async (id) => {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID_CHANNELS, id);
        setChannels(prevState => prevState.filter(channel => channel.$id !== id));
    };

    return (
        <div className="sidebar">
            <h2>Channels</h2>
            <form onSubmit={createChannel}>
                <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="New Channel Name"
                    required
                />
                <button type="submit">Create</button>
            </form>
            <ul>
                {channels.map(channel => (
                    <li key={channel.$id}>
                        <span onClick={() => setCurrentChannel(channel)}>{channel.name}</span>
                        <button onClick={() => deleteChannel(channel.$id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
