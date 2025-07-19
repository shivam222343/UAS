import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    collection,
    addDoc,
    doc,
    getDocs,
    updateDoc,
    getDoc,
    deleteDoc,
    serverTimestamp,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
    Users,
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    User,
    ClipboardList,
    Calendar,
    Clock,
    ArrowUpDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../../components/Loader';

const PanelManagement = () => {
    const [clubs, setClubs] = useState([]);
    const [events, setEvents] = useState([]);
    const [panels, setPanels] = useState([]);
    const [members, setMembers] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedClub, setSelectedClub] = useState('');
    const [selectedEvent, setSelectedEvent] = useState('');
    const [selectedPanel, setSelectedPanel] = useState('');
    const [showEventModal, setShowEventModal] = useState(false);
    const [showPanelModal, setShowPanelModal] = useState(false);
    const [showPanelEditModal, setShowPanelEditModal] = useState(false);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState({
        show: false,
        message: '',
        onConfirm: () => {},
        onCancel: () => {}
    });
    const [newEvent, setNewEvent] = useState({
        name: '',
        description: '',
        date: '',
        time: ''
    });
    const [newPanel, setNewPanel] = useState({
        name: '',
        members: {}
    });
    const [editPanel, setEditPanel] = useState({
        id: '',
        name: '',
        members: {}
    });
    const [newCandidate, setNewCandidate] = useState({
        name: '',
        email: '',
        phone: '',
        status: 'pending',
        notes: '',
        panelId: '',
        interviewDate: '',
        interviewTime: ''
    });
    const [sortAlphabetically, setSortAlphabetically] = useState(true);
    const [candidateSortOption, setCandidateSortOption] = useState('dateTime');
    const [candidateSortDirection, setCandidateSortDirection] = useState('desc');
    const { currentUser } = useAuth();

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError('');
                setSuccess('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const sendInterviewNotification = async (panelId, candidateName) => {
        try {
            if (!selectedClub || !selectedEvent || !panelId) return;

            const panelDoc = await getDoc(doc(db, 'clubs', selectedClub, 'events', selectedEvent, 'panels', panelId));
            const panel = panelDoc.data();
            
            const candidatesSnapshot = await getDocs(
                collection(db, 'clubs', selectedClub, 'events', selectedEvent, 'panels', panelId, 'candidates')
            );
            const candidatesList = candidatesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const nextCandidate = candidatesList.find(c => 
                c.id !== candidateName && (c.status === 'pending' || c.status === 'scheduled')
            );

            const panelMembers = Object.keys(panel.members).filter(id => panel.members[id]);

            const notificationPromises = panelMembers.map(async memberId => {
                const notification = {
                    type: 'interview_completed',
                    title: 'Interview Completed',
                    message: `Interview with ${candidateName} is completed. ${nextCandidate ? `Next candidate: ${nextCandidate.name}` : 'No more candidates'}`,
                    panelName: panel.name,
                    candidateName: candidateName,
                    nextCandidateName: nextCandidate?.name || 'None',
                    read: false,
                    createdAt: serverTimestamp()
                };

                await addDoc(collection(db, 'users', memberId, 'notifications'), notification);
            });

            await Promise.all(notificationPromises);
        } catch (err) {
            console.error('Error sending notification:', err);
        }
    };

    const fetchClubs = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'clubs'));
            const clubsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setClubs(clubsList);
        } catch (err) {
            setError('Failed to fetch clubs');
            console.error(err);
        }
    };

    const fetchEvents = async (clubId) => {
        try {
            if (!clubId) {
                setEvents([]);
                return;
            }

            const querySnapshot = await getDocs(collection(db, 'clubs', clubId, 'events'));
            const eventsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEvents(eventsList);
        } catch (err) {
            setError('Failed to fetch events');
            console.error(err);
        }
    };

    const fetchPanels = async (clubId, eventId) => {
        try {
            if (!clubId || !eventId) {
                setPanels([]);
                return;
            }

            const querySnapshot = await getDocs(collection(db, 'clubs', clubId, 'events', eventId, 'panels'));
            const panelsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPanels(panelsList);
        } catch (err) {
            setError('Failed to fetch panels');
            console.error(err);
        }
    };

    const fetchMembers = async (clubId) => {
        try {
            if (!clubId) {
                setMembers([]);
                return;
            }
            
            const querySnapshot = await getDocs(collection(db, 'clubs', clubId, 'members'));
            const membersList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || '',
                role: doc.data().role || '',
                ...doc.data()
            }));
            setMembers(membersList);
        } catch (err) {
            setError('Failed to fetch members');
            console.error(err);
        }
    };

    const fetchCandidates = async (clubId, eventId, panelId) => {
        try {
            if (!clubId || !eventId || !panelId) {
                setCandidates([]);
                return;
            }

            let candidatesQuery;
            const candidatesRef = collection(db, 'clubs', clubId, 'events', eventId, 'panels', panelId, 'candidates');

            if (candidateSortOption === 'name') {
                candidatesQuery = query(
                    candidatesRef,
                    orderBy('name', candidateSortDirection === 'asc' ? 'asc' : 'desc')
                );
            } else if (candidateSortOption === 'status') {
                candidatesQuery = query(
                    candidatesRef,
                    orderBy('status', candidateSortDirection === 'asc' ? 'asc' : 'desc')
                );
            } else {
                candidatesQuery = query(
                    candidatesRef,
                    orderBy('createdAt', candidateSortDirection === 'asc' ? 'asc' : 'desc')
                );
            }

            const querySnapshot = await getDocs(candidatesQuery);
            const candidatesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                panelId: panelId
            }));
            setCandidates(candidatesList);
        } catch (err) {
            setError('Failed to fetch candidates');
            console.error(err);
        }
    };

    const toggleCandidateSortDirection = () => {
        setCandidateSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const changeCandidateSortOption = (option) => {
        setCandidateSortOption(option);
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();

        if (!selectedClub) {
            setError('Please select a club first');
            return;
        }

        if (!newEvent.name) {
            setError('Event name is required');
            return;
        }

        try {
            await addDoc(collection(db, 'clubs', selectedClub, 'events'), {
                name: newEvent.name,
                description: newEvent.description,
                date: newEvent.date,
                time: newEvent.time,
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid
            });

            setNewEvent({
                name: '',
                description: '',
                date: '',
                time: ''
            });
            setShowEventModal(false);
            fetchEvents(selectedClub);
            setSuccess('Event created successfully');
        } catch (err) {
            setError('Failed to create event');
            console.error(err);
        }
    };

    const toggleMemberSelection = (memberId, isEditMode = false) => {
        if (isEditMode) {
            setEditPanel(prev => ({
                ...prev,
                members: {
                    ...prev.members,
                    [memberId]: !prev.members[memberId]
                }
            }));
        } else {
            setNewPanel(prev => ({
                ...prev,
                members: {
                    ...prev.members,
                    [memberId]: !prev.members[memberId]
                }
            }));
        }
    };

    const toggleSortOrder = () => {
        setSortAlphabetically(!sortAlphabetically);
    };

    const getSortedMembers = () => {
        if (sortAlphabetically) {
            return [...members].sort((a, b) => {
                const nameA = a.displayName || '';
                const nameB = b.displayName || '';
                return nameA.localeCompare(nameB);
            });
        }
        return members;
    };

    const handleCreatePanel = async (e) => {
        e.preventDefault();

        if (!selectedClub || !selectedEvent) {
            setError('Please select a club and event');
            return;
        }

        const selectedMemberIds = Object.keys(newPanel.members).filter(id => newPanel.members[id]);

        if (!newPanel.name || selectedMemberIds.length === 0) {
            setError('Panel name and at least one member is required');
            return;
        }

        try {
            await addDoc(collection(db, 'clubs', selectedClub, 'events', selectedEvent, 'panels'), {
                name: newPanel.name,
                members: selectedMemberIds.reduce((acc, id) => {
                    acc[id] = true;
                    return acc;
                }, {}),
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid
            });

            setNewPanel({
                name: '',
                members: {}
            });
            setShowPanelModal(false);
            fetchPanels(selectedClub, selectedEvent);
            setSuccess('Panel created successfully');
        } catch (err) {
            setError('Failed to create panel');
            console.error(err);
        }
    };

    const openEditPanelModal = (panel) => {
        setEditPanel({
            id: panel.id,
            name: panel.name,
            members: panel.members || {}
        });
        setShowPanelEditModal(true);
    };

    const handleUpdatePanel = async (e) => {
        e.preventDefault();

        if (!selectedClub || !selectedEvent) {
            setError('Please select a club and event');
            return;
        }

        const selectedMemberIds = Object.keys(editPanel.members).filter(id => editPanel.members[id]);

        if (!editPanel.name || selectedMemberIds.length === 0) {
            setError('Panel name and at least one member is required');
            return;
        }

        try {
            await updateDoc(doc(db, 'clubs', selectedClub, 'events', selectedEvent, 'panels', editPanel.id), {
                name: editPanel.name,
                members: selectedMemberIds.reduce((acc, id) => {
                    acc[id] = true;
                    return acc;
                }, {})
            });

            setShowPanelEditModal(false);
            fetchPanels(selectedClub, selectedEvent);
            setSuccess('Panel updated successfully');
        } catch (err) {
            setError('Failed to update panel');
            console.error(err);
        }
    };

    const handleCreateCandidate = async (e) => {
        e.preventDefault();

        if (!newCandidate.name || !newCandidate.panelId) {
            setError('Candidate name and panel selection is required');
            return;
        }

        try {
            await addDoc(collection(db, 'clubs', selectedClub, 'events', selectedEvent, 'panels', newCandidate.panelId, 'candidates'), {
                name: newCandidate.name,
                email: newCandidate.email,
                phone: newCandidate.phone,
                status: newCandidate.status,
                notes: newCandidate.notes,
                interviewDate: newCandidate.interviewDate,
                interviewTime: newCandidate.interviewTime,
                interviewDone: false,
                ratings: {},
                feedback: {},
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid
            });

            setNewCandidate({
                name: '',
                email: '',
                phone: '',
                status: 'pending',
                notes: '',
                panelId: newCandidate.panelId,
                interviewDate: '',
                interviewTime: ''
            });
            fetchCandidates(selectedClub, selectedEvent, newCandidate.panelId);
            setSuccess('Candidate added successfully');
        } catch (err) {
            setError('Failed to add candidate');
            console.error(err);
        }
    };

    const handleUpdateCandidateStatus = async (candidateId, newStatus, panelId) => {
        try {
            await updateDoc(doc(db, 'clubs', selectedClub, 'events', selectedEvent, 'panels', panelId, 'candidates', candidateId), {
                status: newStatus
            });
            fetchCandidates(selectedClub, selectedEvent, panelId);
            setSuccess('Candidate status updated');

            if (newStatus === 'interviewed') {
                const candidate = candidates.find(c => c.id === candidateId);
                if (candidate) {
                    await sendInterviewNotification(panelId, candidate.name);
                }
            }
        } catch (err) {
            setError('Failed to update candidate status');
            console.error(err);
        }
    };

    const handleMarkInterviewDone = async (candidateId, panelId) => {
        try {
            await updateDoc(doc(db, 'clubs', selectedClub, 'events', selectedEvent, 'panels', panelId, 'candidates', candidateId), {
                interviewDone: true,
                status: 'interviewed'
            });
            fetchCandidates(selectedClub, selectedEvent, panelId);
            setSuccess('Interview marked as completed');

            const candidate = candidates.find(c => c.id === candidateId);
            if (candidate) {
                await sendInterviewNotification(panelId, candidate.name);
            }
        } catch (err) {
            setError('Failed to mark interview');
            console.error(err);
        }
    };

    const showConfirm = (message, onConfirm, onCancel = () => {}) => {
        setShowConfirmationModal({
            show: true,
            message,
            onConfirm: () => {
                onConfirm();
                setShowConfirmationModal({ show: false, message: '', onConfirm: () => {}, onCancel: () => {} });
            },
            onCancel: () => {
                onCancel();
                setShowConfirmationModal({ show: false, message: '', onConfirm: () => {}, onCancel: () => {} });
            }
        });
    };

    const handleDeleteEvent = async (eventId) => {
        showConfirm(
            'Are you sure you want to delete this event? All panels and candidates will also be deleted.',
            async () => {
                try {
                    const panelsSnapshot = await getDocs(collection(db, 'clubs', selectedClub, 'events', eventId, 'panels'));
                    const deletePromises = panelsSnapshot.docs.map(panelDoc =>
                        deleteDoc(doc(db, 'clubs', selectedClub, 'events', eventId, 'panels', panelDoc.id))
                    );
                    await Promise.all(deletePromises);

                    await deleteDoc(doc(db, 'clubs', selectedClub, 'events', eventId));

                    fetchEvents(selectedClub);
                    setSelectedEvent('');
                    setSuccess('Event and all associated panels deleted successfully');
                } catch (err) {
                    setError('Failed to delete event');
                    console.error(err);
                }
            }
        );
    };

    const handleDeletePanel = async (panelId) => {
        showConfirm(
            'Are you sure you want to delete this panel? All candidates will also be deleted.',
            async () => {
                try {
                    const candidatesSnapshot = await getDocs(collection(db, 'clubs', selectedClub, 'events', selectedEvent, 'panels', panelId, 'candidates'));
                    const deletePromises = candidatesSnapshot.docs.map(candidateDoc =>
                        deleteDoc(doc(db, 'clubs', selectedClub, 'events', selectedEvent, 'panels', panelId, 'candidates', candidateDoc.id))
                    );
                    await Promise.all(deletePromises);

                    await deleteDoc(doc(db, 'clubs', selectedClub, 'events', selectedEvent, 'panels', panelId));

                    fetchPanels(selectedClub, selectedEvent);
                    setSuccess('Panel and all associated candidates deleted successfully');
                } catch (err) {
                    setError('Failed to delete panel');
                    console.error(err);
                }
            }
        );
    };

    const handleDeleteCandidate = async (candidateId, panelId) => {
        showConfirm(
            'Are you sure you want to delete this candidate?',
            async () => {
                try {
                    await deleteDoc(doc(db, 'clubs', selectedClub, 'events', selectedEvent, 'panels', panelId, 'candidates', candidateId));
                    fetchCandidates(selectedClub, selectedEvent, panelId);
                    setSuccess('Candidate deleted successfully');
                } catch (err) {
                    setError('Failed to delete candidate');
                    console.error(err);
                }
            }
        );
    };

    useEffect(() => {
        fetchClubs();
        setLoading(false);
    }, []);

    useEffect(() => {
        if (selectedClub) {
            fetchEvents(selectedClub);
            fetchMembers(selectedClub);
        } else {
            setEvents([]);
            setMembers([]);
        }
        setSelectedEvent('');
        setPanels([]);
        setCandidates([]);
    }, [selectedClub]);

    useEffect(() => {
        if (selectedClub && selectedEvent) {
            fetchPanels(selectedClub, selectedEvent);
        } else {
            setPanels([]);
        }
        setCandidates([]);
    }, [selectedClub, selectedEvent]);

    useEffect(() => {
        if (selectedClub && selectedEvent && selectedPanel) {
            fetchCandidates(selectedClub, selectedEvent, selectedPanel);
        }
    }, [selectedPanel, candidateSortOption, candidateSortDirection]);

    const EventModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full md:w-1/2 border border-blue-200 mx-2 dark:bg-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
                <h2 className="text-xl font-bold mb-4">Create New Event</h2>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium dark:text-white text-gray-700 mb-1">Event Name*</label>
                        <input
                            type="text"
                            value={newEvent.name}
                            onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                            className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Enter event name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium dark:text-white text-gray-700 mb-1">Description</label>
                        <textarea
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            rows="3"
                            placeholder="Enter event description"
                        ></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-white text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={newEvent.date}
                                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-white text-gray-700 mb-1">Time</label>
                            <input
                                type="time"
                                value={newEvent.time}
                                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowEventModal(false)}
                            className="px-4 py-2 bg-gray-200 dark:bg-blue-400 dark:text-white text-gray-800 rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 dark:bg-green-400 dark:hover:bg-green-500 text-white rounded-md hover:bg-blue-700"
                        >
                            Create Event
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );

    const PanelModal = ({ isEditMode = false }) => {
        const panelData = isEditMode ? editPanel : newPanel;
        const setPanelData = isEditMode ? setEditPanel : setNewPanel;
        const handleSubmit = isEditMode ? handleUpdatePanel : handleCreatePanel;

        return (
            <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        isEditMode ? setShowPanelEditModal(false) : setShowPanelModal(false);
                    }
                }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-slate-800 dark:text-white rounded-lg shadow-xl p-6 w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-xl font-bold mb-4">{isEditMode ? 'Edit Panel' : 'Create New Panel'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-white text-gray-700 mb-1">Panel Name*</label>
                            <input
                                type="text"
                                value={panelData.name}
                                onChange={(e) => setPanelData({ ...panelData, name: e.target.value })}
                                className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                placeholder="Enter panel name"
                                required
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium dark:text-white text-gray-700">Select Members*</label>
                                <button
                                    onClick={toggleSortOrder}
                                    className="flex items-center text-xs text-white-600 hover:underline"
                                >
                                    <ArrowUpDown className="w-3 h-3 mr-1" />
                                    {sortAlphabetically ? 'Sorted' : 'Default'}
                                </button>
                            </div>
                            <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                                {members.length === 0 ? (
                                    <p className="text-sm text-gray-500">No members found in this club</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {getSortedMembers().map(member => (
                                            <div key={member.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`member-${member.id}`}
                                                    checked={!!panelData.members[member.id]}
                                                    onChange={() => toggleMemberSelection(member.id, isEditMode)}
                                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                />
                                                <label htmlFor={`member-${member.id}`} className="ml-2 text-sm">
                                                    {member.displayName || 'Unnamed Member'} ({member.role || 'No Role'})
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => isEditMode ? setShowPanelEditModal(false) : setShowPanelModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {isEditMode ? 'Update Panel' : 'Create Panel'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        );
    };

    const CandidateModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 m-2 flex items-center justify-center z-50">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-slate-800 dark:text-white rounded-lg shadow-xl p-6 w-full max-w-md"
            >
                <h2 className="text-xl font-bold mb-4">Add New Candidate</h2>
                <form onSubmit={handleCreateCandidate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-200 text-gray-700 mb-1">Select Panel*</label>
                        <select
                            value={newCandidate.panelId}
                            onChange={(e) => setNewCandidate({ ...newCandidate, panelId: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        >
                            <option value="">Select a panel</option>
                            {panels.map(panel => (
                                <option key={panel.id} value={panel.id}>{panel.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-200 text-gray-700 mb-1">Candidate Name*</label>
                        <input
                            type="text"
                            value={newCandidate.name}
                            onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Enter candidate name"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-200 text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={newCandidate.email}
                                onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="Enter email"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-200 text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={newCandidate.phone}
                                onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                                className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                placeholder="Enter phone number"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-200 text-gray-700 mb-1">Interview Date</label>
                            <input
                                type="date"
                                value={newCandidate.interviewDate}
                                onChange={(e) => setNewCandidate({ ...newCandidate, interviewDate: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-200 text-gray-700 mb-1">Interview Time</label>
                            <input
                                type="time"
                                value={newCandidate.interviewTime}
                                onChange={(e) => setNewCandidate({ ...newCandidate, interviewTime: e.target.value })}
                                className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-200 text-gray-700 mb-1">Initial Status</label>
                        <select
                            value={newCandidate.status}
                            onChange={(e) => setNewCandidate({ ...newCandidate, status: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="pending">Pending</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="rejected">Rejected</option>
                            <option value="selected">Selected</option>
                            <option value="interviewed">Interviewed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-200 text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={newCandidate.notes}
                            onChange={(e) => setNewCandidate({ ...newCandidate, notes: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            rows="3"
                            placeholder="Any additional notes..."
                        ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowCandidateModal(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Add Candidate
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );

    const ConfirmationModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-slate-800 dark:text-white rounded-lg shadow-xl p-6 w-full max-w-md"
            >
                <h3 className="text-lg font-bold mb-4">Confirm Action</h3>
                <p className="mb-6">{showConfirmationModal.message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={showConfirmationModal.onCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={showConfirmationModal.onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Confirm
                    </button>
                </div>
            </motion.div>
        </div>
    );

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Interview Panel Management</h2>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            {/* Club and Event Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium dark:text-white text-gray-700 mb-1">Select Club*</label>
                    <select
                        value={selectedClub}
                        onChange={(e) => setSelectedClub(e.target.value)}
                        className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="">Select a club</option>
                        {clubs.map(club => (
                            <option key={club.id} value={club.id}>{club.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end space-x-2">
                    <div className="flex-1">
                        <label className="block text-sm font-medium dark:text-white text-gray-700 mb-1">Select Event</label>
                        <select
                            value={selectedEvent}
                            onChange={(e) => setSelectedEvent(e.target.value)}
                            className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            disabled={!selectedClub}
                        >
                            <option value="">Select an event</option>
                            {events.map(event => (
                                <option key={event.id} value={event.id}>{event.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => setShowEventModal(true)}
                        disabled={!selectedClub}
                        className="px-3 py-2 bg-green-600 dark:bg-green-700 dark:text-green-200 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        title="Create New Event"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Events Section */}
            {selectedClub && events.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Events</h3>
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-md p-4">
                        {events.map(event => (
                            <div
                                key={event.id}
                                className={`p-3 rounded-md mb-2 cursor-pointer ${selectedEvent === event.id ? 'bg-blue-100 dark:bg-slate-900 dark:text-white border border-blue-200' : 'bg-white dark:bg-slate-800 dark:text-white hover:bg-gray-100 border'}`}
                                onClick={() => setSelectedEvent(event.id)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-medium">{event.name}</h4>
                                        {event.description && (
                                            <p className="text-sm dark:text-gray-200 text-gray-600 mt-1">{event.description}</p>
                                        )}
                                        {(event.date || event.time) && (
                                            <div className="flex items-center dark:text-gray-300 text-sm text-gray-500 mt-1">
                                                {event.date && (
                                                    <span className="flex items-center mr-3">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {new Date(event.date).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {event.time && (
                                                    <span className="flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {event.time}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteEvent(event.id);
                                        }}
                                        className="text-red-600 bg-transparent dark:bg-transparent hover:text-red-800 p-1"
                                        title="Delete Event"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Panels Section */}
            {selectedClub && selectedEvent && (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Panels</h3>
                        <button
                            onClick={() => setShowPanelModal(true)}
                            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            disabled={!selectedEvent}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Create Panel
                        </button>
                    </div>

                    {panels.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-slate-800 dark:text-white rounded-md p-4 text-center text-gray-500">
                            No panels created yet for this event
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {panels.map(panel => (
                                <div
                                    key={panel.id}
                                    className={`border rounded-lg p-4 ${selectedPanel === panel.id ? 'bg-blue-50 cursor-pointer dark:bg-slate-900 dark:text-white border-blue-200' : 'bg-white cursor-pointer dark:bg-slate-800 dark:text-white hover:bg-gray-50'}`}
                                    onClick={() => setSelectedPanel(panel.id)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium dark:text-white">{panel.name}</h4>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditPanelModal(panel);
                                                }}
                                                className="text-blue-600 hover:bg-transparent bg-transparent dark:text-blue-300 hover:text-blue-800 p-1"
                                                title="Edit Panel"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNewCandidate(prev => ({ ...prev, panelId: panel.id }));
                                                    setShowCandidateModal(true);
                                                }}
                                                className="text-blue-600 hover:bg-transparent bg-transparent dark:text-blue-300 hover:text-blue-800 p-1"
                                                title="Add Candidate"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeletePanel(panel.id);
                                                }}
                                                className="text-red-600 bg-transparent hover:bg-transparent hover:text-red-800 p-1"
                                                title="Delete Panel"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-600 mb-3">
                                        <div className="font-medium dark:text-white">Members:</div>
                                        <ul className="list-disc dark:text-gray-200 list-inside">
                                            {Object.entries(panel.members)
                                                .filter(([_, isMember]) => isMember)
                                                .map(([memberId]) => {
                                                    const member = members.find(m => m.id === memberId);
                                                    return member ? (
                                                        <li key={memberId}>{member.displayName} ({member.role})</li>
                                                    ) : null;
                                                })}
                                        </ul>
                                    </div>

                                    <div className="border-t pt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">
                                                Candidates: {candidates.filter(c => c.panelId === panel.id).length}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Created: {new Date(panel.createdAt?.seconds * 1000).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Candidates Section */}
            {selectedClub && selectedEvent && selectedPanel && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Candidates for {panels.find(p => p.id === selectedPanel)?.name || 'Selected Panel'}
                        </h3>
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <select
                                    value={candidateSortOption}
                                    onChange={(e) => changeCandidateSortOption(e.target.value)}
                                    className="appearance-none bg-white dark:bg-slate-700 border border-gray-300 rounded-md px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="dateTime">Date & Time</option>
                                    <option value="name">Name</option>
                                    <option value="status">Status</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>
                            <button
                                onClick={toggleCandidateSortDirection}
                                className="p-1 rounded-md bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600"
                                title={candidateSortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}
                            >
                                <ArrowUpDown className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    setNewCandidate(prev => ({ ...prev, panelId: selectedPanel }));
                                    setShowCandidateModal(true);
                                }}
                                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                <span className='hidden md:block'>Add Candidate</span>
                            </button>
                        </div>
                    </div>

                    {candidates.filter(c => c.panelId === selectedPanel).length === 0 ? (
                        <div className="bg-gray-50 rounded-md dark:bg-slate-700 dark:text-white p-4 text-center text-gray-500">
                            No candidates added yet for this panel
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 dark:bg-slate-700 dark:text-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Interview</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-700 dark:text-white divide-y divide-gray-200">
                                    {candidates
                                        .filter(c => c.panelId === selectedPanel)
                                        .map(candidate => (
                                            <tr className='dark:hover:bg-slate-800 hover:bg-slate-100 duration-200' key={candidate.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium dark:text-gray-100 text-gray-900">{candidate.name}</div>
                                                    {candidate.notes && (
                                                        <div className="text-xs dark:text-gray-200 text-gray-500 mt-1">{candidate.notes}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm dark:text-gray-100 text-gray-900">{candidate.email}</div>
                                                    <div className="text-sm dark:text-gray-200 text-gray-500">{candidate.phone}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {candidate.interviewDate && (
                                                        <div className="text-sm">
                                                            <div className="flex items-center dark:text-gray-100 text-gray-900">
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                {new Date(candidate.interviewDate).toLocaleDateString()}
                                                            </div>
                                                            {candidate.interviewTime && (
                                                                <div className="flex items-center dark:text-gray-100 text-gray-500 mt-1">
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    {candidate.interviewTime}
                                                                </div>
                                                            )}
                                                        </div>)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        value={candidate.status}
                                                        onChange={(e) => handleUpdateCandidateStatus(candidate.id, e.target.value, candidate.panelId)}
                                                        className={`text-sm rounded-md px-2 py-1 ${candidate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                candidate.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                                    candidate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                        'bg-green-100 text-green-800'
                                                            }`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="scheduled">Scheduled</option>
                                                        <option value="rejected">Rejected</option>
                                                        <option value="selected">Selected</option>
                                                        <option value="interviewed">Interviewed</option>
                                                    </select>
                                                    {!candidate.interviewDone && candidate.status === 'scheduled' && (
                                                        <button
                                                            onClick={() => handleMarkInterviewDone(candidate.id, candidate.panelId)}
                                                            className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200"
                                                        >
                                                            Mark Done
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleDeleteCandidate(candidate.id, candidate.panelId)}
                                                        className="text-red-600 bg-transparent dark:bg-transparent hover:bg-transparent hover:text-red-900"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showEventModal && <EventModal />}
            {showPanelModal && <PanelModal />}
            {showPanelEditModal && <PanelModal isEditMode={true} />}
            {showCandidateModal && <CandidateModal />}
            {showConfirmationModal.show && <ConfirmationModal />}
        </div>
    );
};

export default PanelManagement;