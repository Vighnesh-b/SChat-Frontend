import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import LogoutButton from '../components/LogoutButton';
import MessageWindow from '../Pages/MessageWindow';
import '../styles.css';
import getRandomProfile from '../components/random_img';
import { showSuccessToast, showErrorToast, showInfoToast } from '../components/toast';

function Home() {
  const navigate = useNavigate();
  const [friendList, setFriendList] = useState([]);
  const [incomingList, setIncomingList] = useState([]);
  const [outgoingList, setOutgoingList] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [window, setWindow] = useState('All');
  const [searchElement, setSearchElement] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/Login');
    }
  }, [navigate]);

  const fetchFriendData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user.id;
      const res = await axios.get(`/userinfo/${userId}`);
      setFriendList(res.data.userInformation.friendsList);
      setIncomingList(res.data.userInformation.incomingFriendRequests);
      setOutgoingList(res.data.userInformation.outgoingFriendRequests);
    } catch (err) {
      console.error('Failed to fetch friend data:', err);
      
    }
  };

  useEffect(() => {
    fetchFriendData();
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (!searchElement.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/search?searchTerm=${encodeURIComponent(searchElement)}`);
        setSearchResults(response.data.results);
        if (response.data.results.length === 0) {
          showInfoToast('No users found');
        }
      } catch (error) {
        console.error('Search error:', error);
        showErrorToast('Error searching users');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      if (searchElement) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchElement]);

  const handleAddFriend = async (userId) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const res = await axios.post('/sendFriendRequest', {
        senderId: currentUser.id,
        receiverId: userId
      });
      
      if (res.status === 200) {
        showSuccessToast('Friend request sent');
        fetchFriendData();
      } else {
        showErrorToast(res.data.error || 'Failed to send request');
      }
    } catch (err) {
      console.error('Add friend error:', err);
      showErrorToast(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await axios.post('/acceptFriendRequest', {
        requestId: requestId,  
        accepterId: user.id    
      });
      
      if (response.data.success) {
        showSuccessToast(`You are now friends with ${response.data.friend.name}`);
        fetchFriendData();
      } else {
        showErrorToast(response.data.error);
      }
    } catch (error) {
      showErrorToast('Failed to accept friend request');
      console.error('Accept error:', error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const res = await axios.post('/rejectFriendRequest', { requestId });
      if (res.status === 200) {
        showSuccessToast('Friend request rejected');
        fetchFriendData();
      }
    } catch (err) {
      console.error('Reject error:', err);
      showErrorToast('Failed to reject request');
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      const res = await axios.post('/cancelFriendRequest', { requestId });
      if (res.status === 200) {
        showSuccessToast('Friend request canceled');
        fetchFriendData();
      }
    } catch (err) {
      console.error('Cancel error:', err);
      showErrorToast('Failed to cancel request');
    }
  };

  return (
    <div className="bg-black h-screen w-screen flex">
      <div className="bg-gray-900 w-1/3 flex flex-col overflow-y-auto h-full space-y-4 p-4">
        <div className="flex justify-between items-center mb-4 mr-2">
          <p className="text-white text-3xl font-bold">SChat</p>
          <LogoutButton />
        </div>

        <div className='flex items-center border-b border-gray-700 pb-2'>
          <p className='text-white text-xl font-bold mr-4'>Friends</p>
          <button 
            className={`text-white mr-4 p-1.5 rounded-lg cursor-pointer ${window === 'All' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
            onClick={() => setWindow('All')}
          >
            All
          </button>
          <button 
            className={`text-white mr-4 p-1.5 rounded-lg cursor-pointer ${window === 'Pending' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
            onClick={() => setWindow('Pending')}
          >
            Pending
          </button>
          <button 
            className={`text-white p-1.5 rounded-lg cursor-pointer ${window === 'Add Friend' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={() => {
              setWindow('Add Friend');
              setSearchElement('');
              setSearchResults([]);
            }}
          >
            Add Friend
          </button>
        </div>

        {window === 'All' && (
          <>
            {friendList.length > 0 ? (
              friendList.map((element, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center space-x-4 p-2 rounded-xl cursor-pointer ${receiver?.friendId === element.friendId ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                  onClick={() => setReceiver(element)}
                >
                  <img
                    src={getRandomProfile()}
                    alt="Friend Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <p className="text-white">{element.friendName}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No friends yet</p>
            )}
          </>
        )}

        {window === 'Pending' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-2">Incoming Requests</h3>
              {incomingList.length > 0 ? (
                incomingList.map((element, idx) => (
                  <div key={`incoming-${idx}`} className="mb-4 p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={getRandomProfile()}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-white">{element.Name}</p>
                          <p className="text-gray-400 text-sm">{element.Id}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700"
                          onClick={() => handleAcceptRequest(element.Id)}
                        >
                          ✓
                        </button>
                        <button 
                          className="bg-red-600 text-white p-1.5 rounded hover:bg-red-700"
                          onClick={() => handleRejectRequest(element.Id)}
                        >
                          X
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No incoming requests</p>
              )}
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">Outgoing Requests</h3>
              {outgoingList.length > 0 ? (
                outgoingList.map((element, idx) => (
                  <div key={`outgoing-${idx}`} className="mb-4 p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={getRandomProfile()}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-white">{element.Name}</p>
                          <p className="text-gray-400 text-sm">{element.Id}</p>
                        </div>
                      </div>
                      <button 
                        className="bg-gray-600 text-white p-1.5 rounded hover:bg-gray-700"
                        onClick={() => handleCancelRequest(element.Id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No outgoing requests</p>
              )}
            </div>
          </div>
        )}

        {window === 'Add Friend' && (
          <div className="space-y-4">
            <input 
              type='text' 
              placeholder='Enter username/email/id' 
              value={searchElement} 
              onChange={(e) => setSearchElement(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {loading ? (
              <div className="flex justify-center py-4">
                <p className="text-gray-400">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((element, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={getRandomProfile()}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-white">{element.name}</p>
                        <p className="text-gray-400 text-sm">{element.email}</p>
                      </div>
                    </div>
                    <button 
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      onClick={() => handleAddFriend(element._id)}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            ) : searchElement ? (
              <p className="text-gray-400 text-center py-4">No users found</p>
            ) : (
              <p className="text-gray-400 text-center py-4">Search for users to add as friends</p>
            )}
          </div>
        )}
      </div>

      <div className="w-2/3 h-full">
        <MessageWindow recipient={receiver} />
      </div>
    </div>
  );
}

export default Home;