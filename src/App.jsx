import { useRef, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  collection,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
const firebaseConfig = {
  apiKey: 'AIzaSyB0Ce3w4Ghjc93A5Iy-zrLVr9hqVCaH6KM',
  authDomain: 'fir-practice-1fd89.firebaseapp.com',
  projectId: 'fir-practice-1fd89',
  storageBucket: 'fir-practice-1fd89.appspot.com',
  messagingSenderId: '887284930290',
  appId: '1:887284930290:web:b7cf102c6d7711fa42226b',
  measurementId: 'G-0XQB64VHFR',
};

const app = initializeApp(firebaseConfig); //實例化firebase
const db = getFirestore(app); //實例化db
function App() {
  const [userName, setUserName] = useState(null);
  const [userId, setUserId] = useState(null);
  const [hasSended, setHasSended] = useState(false);
  const [hasGetReq, sethasGetReq] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequest, setFriendRequest] = useState(null);
  const [friendRequestID, setFriendRequestID] = useState(null);
  const [friendList, setFriendList] = useState(null);
  const [searchData, setSearchData] = useState(null);
  const [myId, setMyId] = useState('Jy2YPehQqaR81DawUlL9');
  const listenPost = () => {
    return onSnapshot(collection(db, 'posts'), (querySnapshot) => {
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const dataWithId = {
            id: change.doc.id,

            ...change.doc.data(),
          };
          console.log('New post: ', dataWithId);
        }
      });
    });
  };
  const listenFriendsReq = () => {
    if (!myId) return;
    const userDocRef = doc(db, 'users', myId); //取得文檔(doc)的引用
    console.log('userDocRef: ', userDocRef);
    return onSnapshot(userDocRef, async (docSnapshot) => {// 監聽文檔裡面的變化, 回傳的是監聽的function (onSnapshot)
      const friendRequests = docSnapshot.data().friendRequests?.from || [];
      console.log('聽好友', friendRequests);
      setFriendRequestID(friendRequests);
      const abc = await getUserNames(friendRequests);
      setFriendRequest(abc);
      const friends = docSnapshot.data().friends || [];
      if (friends.includes(userId)) {
        setIsFriend(true);
      }
      const def = await getUserNames(friends);
      setFriendList(def);
    });
  };
  const loginInit = async () => {
    const userDocRef = doc(db, 'users', myId); //根據ID取得文檔引用
    try {
      const docSnapshot = await getDoc(userDocRef);//取得單一文檔的快照
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();//取得文檔裡面的所有data
        const friendRequests = userData.friendRequests?.from || [];
        console.log('登入找朋友', friendRequests);
        const abc = await getUserNames(friendRequests);
        const friends = userData.friends || [];
        const def = await getUserNames(friends);
        setFriendRequest(abc);
        setFriendList(def);
      } else {
        console.log('User document does not exist.');
      }
    } catch (error) {
      console.error('Error getting user document:', error);
    }
  };
  useEffect(() => {
    loginInit();

    // const postUnsubscribe = listenPost();
    const friendsReqUnsubscribe = listenFriendsReq(); //監聽的function本身會回傳一個關閉監聽的function
    return () => {
      // postUnsubscribe();
      if (friendsReqUnsubscribe) {
        friendsReqUnsubscribe(); // 在特定條件會執行關閉監聽的function
      }
    };
  }, [userId]);
  const inputRef1 = useRef();
  const inputRef2 = useRef();
  const inputRef3 = useRef();
  const inputRef4 = useRef();
  const inputRef5 = useRef();
  const tagRef = useRef();
  const tag2Ref = useRef();
  const tag3Ref = useRef();

  const postArticle = async () => {
    const value1 = inputRef1.current.value;
    const value2 = inputRef2.current.value;
    const value3 = inputRef3.current.value;
    const value4 = inputRef4.current.value;
    const selectedTag = tagRef.current.value;

    const userData = {
      name: value3,
      email: value4,
    };
    let userId;
    try {
      const querySnapshot = await getDocs( //從所有文檔裡面找(所以是getDocs)
        query(collection(db, 'users'), where('email', '==', userData.email))//根據條件篩選出指定的文檔條件，這裡是要找到文檔裡面data 符合  userData.email 的文件
      );
      if (querySnapshot.empty) {
        const userDoc = await addDoc(collection(db, 'users'), userData); //addDoc會添加文檔到指定的collection，並自動生成不重複的ID， 另一種firebase的方法是setDoc(可以指定文檔ID)
        userData.id = userDoc.id;
        const newUserData = {
          ...userData,
          id: userDoc.id,
        };
        userId = userDoc.id;
        await updateDoc(doc(db, 'users', userDoc.id), newUserData); //根據collection和文檔ID更新文檔的內容
        console.log('新增新用戶', userId);
      } else {
        userId = querySnapshot.docs[0].id;
        console.log('此郵件已被使用', userId);
      }
      const postData = {
        title: value1,
        content: value2,
        tag: selectedTag,
        author_id: userId,
        created_time: Timestamp.now(),
      };
      const postDoc = await addDoc(collection(db, 'posts'), postData);
      const newPostData = {
        ...postData,
        id: postDoc.id,
      };
      await updateDoc(doc(db, 'posts', postDoc.id), newPostData);
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  const findUser = async () => {
    const value5 = inputRef5.current.value;
    const querySnapshot = await getDocs(
      query(collection(db, 'users'), where('email', '==', value5))
    );
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      setUserName(userDoc.data().name);
      setUserId(userDoc.data().id);
      if (friendRequestID == userDoc.data().id) {
        setIsFriend(false);
        setHasSended(false);
        sethasGetReq(true);
      } else {
        const isFriend = userDoc.data().friends?.includes(myId);
        checkIsSended(userDoc.data().id);
        setIsFriend(isFriend);
        sethasGetReq(false);
      }
    } else {
      console.log('No user found with the provided email.');
    }
  };
  const checkIsSended = async (id) => {
    const userDocRef = doc(db, 'users', id);

    const userSnapshot = await getDoc(userDocRef);
    const userFriendRequests = userSnapshot.data().friendRequests || {
      from: [],
      to: [],
    };
    const isSended = userFriendRequests.from.includes(myId);

    setHasSended(isSended);
  };
  const sendFriendRequest = async () => {
    console.log('發邀請');
    const userDocRef = doc(db, 'users', userId);

    const userSnapshot = await getDoc(userDocRef);

    const userFriendRequests = userSnapshot.data().friendRequests || {
      from: [],
      to: [],
    };
    userFriendRequests.from = userFriendRequests.from || [];
    userFriendRequests.to = userFriendRequests.to || [];
    userFriendRequests.from.push(myId);

    await updateDoc(userDocRef, {
      friendRequests: userFriendRequests,
    });
    const myDocRef = doc(db, 'users', myId);
    const mySnapshot = await getDoc(myDocRef);
    const myFriendRequests = mySnapshot.data().friendRequests || {
      from: [],
      to: [],
    };
    myFriendRequests.from = myFriendRequests.from || [];
    myFriendRequests.to = myFriendRequests.to || [];

    myFriendRequests.to.push(userId);

    await updateDoc(myDocRef, {
      friendRequests: myFriendRequests,
    });

    setHasSended(true);
    sethasGetReq(false);
  };
  const getUserNames = async (friendRequest) => {
    console.log('轉換');
    const userNames = [];

    try {
      for (const userId of friendRequest) {
        const userDocRef = doc(db, 'users', userId);
        const docSnapshot = await getDoc(userDocRef);

        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const userName = userData.name;
          userNames.push(userName);
        } else {
          console.log(`User document with ID ${userId} does not exist.`);
        }
      }
    } catch (error) {
      console.error('Error getting user documents:', error);
    }
    console.log(userNames, 'TW');
    return new Promise((resolve) => {
      resolve(userNames);
    });
  };
  const findUserIdByName = async (userName) => {
    try {
      const usersCollectionRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollectionRef);

      let userId = null;
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.name === userName) {
          userId = doc.id;
        }
      });

      if (userId) {
        return userId;
      } else {
        console.log('用戶不存在');
        return null;
      }
    } catch (error) {
      console.error('查訊時出現錯誤：', error);
      return null;
    }
  };

  const acceptFriend = async (friendId) => {
    friendId = await findUserIdByName(friendId);

    try {
      console.log('接受好友', friendId);
      const myDocRef = doc(db, 'users', myId);
      const myDocSnapshot = await getDoc(myDocRef);
      let myData = myDocSnapshot.data();
      myData.friendRequests.from = myData.friendRequests.from.filter(
        (id) => id !== friendId
      );
      await updateDoc(myDocRef, myData);
      myData.friends = myData.friends || [];
      myData.friends.push(friendId);
      await updateDoc(myDocRef, myData);
      const friendDocRef = doc(db, 'users', friendId);
      const friendDocSnapshot = await getDoc(friendDocRef);
      let friendData = friendDocSnapshot.data() || {
        friends: [],
        friendRequests: { from: [], to: [] },
      };

      friendData.friendRequests.to = friendData.friendRequests.to.filter(
        (id) => id !== myId
      );
      friendData.friends = friendData.friends || [];
      friendData.friends.push(myId);
      await updateDoc(friendDocRef, friendData);
      if (friendRequestID.includes(friendId)) {
        sethasGetReq(false);
        setIsFriend(true);
      }
      console.log(`成功++: ${friendId}。`);
    } catch (error) {
      console.error('添加出錯', error);
    }
  };

  const searchClick = async () => {
    const selectedTag = tag2Ref.current.value;
    const selectedfriend = tag3Ref.current.value;
    if (!selectedfriend && !selectedTag) {
      setSearchData('');
      return;
    }
    console.log('選的朋友', selectedfriend);
    let friendId = null;
    if (selectedfriend) {
      friendId = await findUserIdByName(selectedfriend);
    }
    console.log(selectedTag, selectedfriend);
    try {
      const postsCollectionRef = collection(db, 'posts');
      let queryRef = postsCollectionRef;

      if (selectedTag) {
        queryRef = query(queryRef, where('tag', '==', selectedTag));
      }
      if (selectedfriend) {
        queryRef = query(queryRef, where('author_id', '==', friendId));
      }

      const querySnapshot = await getDocs(queryRef);

      const postsData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const postData = doc.data();
          const authorId = postData.author_id;
          const userName = await getUserNames([authorId]);
          console.log(userName, 'nameeee');
          return {
            ...postData,
            author_name: userName[0],
          };
        })
      );
      setSearchData(postsData);
    } catch (error) {
      console.error('查詢文章時出錯', error);
      return null;
    }
  };

  const cancelFriendRequest = async () => {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    const userFriendRequests = userSnapshot.data().friendRequests;
    userFriendRequests.from = userFriendRequests.from.filter(
      (id) => id !== myId
    );

    await updateDoc(userDocRef, {
      friendRequests: userFriendRequests,
    });

    const myDocRef = doc(db, 'users', myId);
    const mySnapshot = await getDoc(myDocRef);
    const myFriendRequests = mySnapshot.data().friendRequests;
    myFriendRequests.to = myFriendRequests.to.filter((id) => id !== userId);

    await updateDoc(myDocRef, {
      friendRequests: myFriendRequests,
    });
    setHasSended(false);
  };

  return (
    <>
      <div className="topDiv">
        <div className="postDiv">
          <input type="text" ref={inputRef3} placeholder="name" />
          <input type="email" ref={inputRef4} placeholder="email" />
          <input type="text" ref={inputRef1} placeholder="title" />
          <input type="text" ref={inputRef2} placeholder="content" />
          <select ref={tagRef}>
            <option value="Beauty">Beauty</option>
            <option value="Gossiping">Gossiping</option>
            <option value="SchoolLife">SchoolLife</option>
          </select>
          <button onClick={postArticle}>送出</button>
        </div>
        <div className="searchDiv">
          <select ref={tag2Ref}>
            <option value="">無</option>
            <option value="Beauty">Beauty</option>
            <option value="Gossiping">Gossiping</option>
            <option value="SchoolLife">SchoolLife</option>
          </select>
          <select ref={tag3Ref}>
            {friendList &&
              friendList.map((friend, i) => (
                <option key={i} value={friend}>
                  {friend}
                </option>
              ))}
            <option value="">無</option>
          </select>
          <button onClick={searchClick}>搜尋</button>
        </div>
        <div className="searchArticle"></div>
        {searchData &&
          searchData.map((searchData, i) => {
            return (
              <div key={i}>
                <p>作者:{searchData.author_name}</p>
                <p>
                  發布時間:{searchData.created_time.toDate().toLocaleString()}
                </p>
                <p>標題:{searchData.title}</p>
                <p>內容:{searchData.content}</p>
                <p>tag:{searchData.tag}</p>
              </div>
            );
          })}
      </div>

      <div className="findUserDiv">
        <input type="email" ref={inputRef5} placeholder="email" />
        <button onClick={findUser}>查詢用戶</button>

        {userName && (
          <>
            <h3>
              找到用戶 {userName}，id: {userId}
            </h3>
            {myId === userId ? (
              <h3>這是你自己</h3>
            ) : isFriend ? (
              <h3>已經是好友</h3>
            ) : hasGetReq ? (
              <h3>已收到朋友邀請</h3>
            ) : hasSended ? (
              <>
                <h3>已經發送過邀請</h3>
                <button onClick={cancelFriendRequest}>取消好友邀請</button>
              </>
            ) : (
              <button onClick={sendFriendRequest}>發送好友邀請</button>
            )}
          </>
        )}
      </div>
      <h2>好友請求:</h2>
      {friendRequest &&
        friendRequest.map((friendId) => {
          return (
            <>
              <p key={friendId}>{friendId}</p>
              <button
                onClick={() => {
                  acceptFriend(friendId);
                }}
              >
                你只能接受
              </button>
            </>
          );
        })}
      <h2>好友</h2>
      {friendList &&
        friendList.map((friend) => {
          return (
            <>
              <p key={friend}>{friend}</p>
            </>
          );
        })}
    </>
  );
}

export default App;
