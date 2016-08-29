/**
 * Created by Administrator on 2016/4/27.
 */

//用于缓存本地的聊天记录
rootModule.factory('ChatCacheService',function(LocalStorage,$rootScope,$ionicHistory,ImgPathService) {
    //聊天记录的数据结构说明，对于每个用户id，对应一个聊天缓存，该缓存结构如下:
    //chatCache={
    //   chatDic:  dictionary   该结构用于存储聊天记录，以目标用户ID为key，聊天内容为value,
    //   chatOrderList: array   该结构用于规定用户聊天记录的展示顺序，每当接收到某用户的聊天记录时，该记录置为第一个
    //   chatLastIdReceive; int  存储用户接受到的最后一条聊天记录，当用户登录聊天服务器，根据最后一条记录和push状态来将离线期间的数据推送
    // }
    //
    //chatDic= {key:value}   key为目标用户id，
    //value={
    //  chatRecords: array  与该用户的聊天记录,
    //  userInfo： object   目标用户的个人信息，包括姓名，性别，头像等
    //  unReadNum: int      与该用户的聊天记录中未阅读的条数
    // }
    //
    //chatRecord= {         一条聊天记录
    //  type:  int          记录用户发送的消息类型，详见$rootScope.MSG_TYPE
    //  content: msg,       消息内容，如果是文本类则直接是消息内容，如果是图片，则是图片的链接，图片链接包括缩略图链接和相图链接
    //  target_id: int      聊天记录接收方id
    //  src_id: int         聊天记录发送发id
    //  create_time: time   聊天记录的产生时间
    //  send_state: int  记录聊天记录是否发送成功，只有用户本人发送的消息才具有该属性，用户接受到的消息没有该属性  0:发送中 1: 发送成功 2:发送失败
    // }
    //
    //userInfo={
    //  user_id: int
    //  userNameRespect: str    用户尊称
    //  avatars_name: str       用户头像路径，在每次获取聊天数据时，可以对比头像是否发生改变，从而动态响应对方的头像修改
    //  level: int              用户等级，在聊天记录中显示用户身份，每次获取聊天数据时更新该信息
    // }



    //为了避免过多的聊天记录带来的本地缓存的性能影响，设置最多保存最近的50条聊天联系人，如果超过50条，则将最后一条删去
    var MAX_CHAT_USER_RECORD=50;
    //最多保存与某用户的最近500条聊天记录，一旦超过该限度，一次性删去50条。
    var MAX_CHAT_PER_USER=500;
    var RECORD_CLEAR_PER_TIME=50;


    //聊天缓存结构定义，具体含义如上文描述
    var chatCache={
        chatDic: {},
        chatOrderList: [],
        chatLastIdReceive: null
    };

    //本地存储聊天信息的关键字前缀，chat_cache_id
    var chat_pre='chat_cache';

    //记录总体的未阅读的消息数量
    $rootScope.UnReadMsgNum=0;


    //获取本地存储登录用户的聊天消息,用户登录成功后调用
    function readChatCache(user_id){
        var chat_key=chat_pre+user_id;
        var data=LocalStorage.getObject(chat_key);
        if(data!=null)
        {
            chatCache=data;
        }
        updateUnReadMsgNumber();
        changeWaitStateToFailedWhenReadCache();

    }

    /**
     * 获取聊天字典
     * @returns object
     */
    function getChatDic() {
        return chatCache.chatDic;
    }


    /**
     *
     * @param chat_user_id int 与之聊天的对方的用户id
     * @param data obj 聊天记录的内容
     */
    function addReceivedChatRecord(chat_user_id,data){
        //当该用户的聊天记录已经存在时
        if(chatCache.chatDic.hasOwnProperty(chat_user_id))
        {
            //更新用户头像
            chatCache.chatDic[chat_user_id].userInfo.avatars_name=data.avatars_name;
            chatCache.chatDic[chat_user_id].userInfo.level=data.src_level;
            //对图像类型的数据进行处理
            if(data.type==$rootScope.MSG_TYPE.IMG)
            {
                ImgPathService.generateChatImgUrl(data);
            }
            chatCache.chatDic[chat_user_id].chatRecords.push(data);
            //判断当前是否在聊天详情页面且程序前台执行的时候，并且是否与对应的该用户进行聊天，如果是，不加1，否则，unread+1
            if($ionicHistory.currentStateName()=='chat-detail' && $rootScope.chatUserInfo.user_id==chat_user_id && $rootScope.isActive)
            {
                console.log("正在当前聊天页面");
            }
            else
            {
                chatCache.chatDic[chat_user_id].unReadNum++;
            }
            chatCache.chatLastIdReceive=data.chat_id;
            updateUnReadMsgNumber();
            //更新聊天顺序队列
            updateChatOrderListOnAdd(chat_user_id);
            //判断与该用户的聊天记录是否超出
            isChatRecordOverflow(chat_user_id);
        }
        else
        {

            console.log('与该用户的聊天记录不存在');
        }
    }

    // 添加系统消息, 系统消息共用聊天的缓存体系, 但是不会进入聊天详情, 待测试
    // 系统消息格式:
    // chatRecords: list
    // userInfo: {user_id: $rootScope.SYSTEM_MSG_ID, userNameRespect: "系统消息"}
    // 每条record ={
    //  target_id: 目标id, 应该等于当前的用户id
    //  type: 消息类型,目前仅限交易申请
    //  content: str, 消息内容, 用于消息展示和本地通知
    //  msg_create_time: 消息创建时间, 在系统消息列表中要加上各个消息的创建时间
    //  src_info: { userInfo:    和  storeInfo:  包含交易申请发起人的所有信息, 可以用于交易申请的展示,
    //                                          结构等同于本地$rootScope中的userInfo和storeInfo
    //    }
    //  has_read: false ,记录这条系统消息是否被点击阅读
    //  chat_id: 这一条系统消息在chat表中对应的id,目前只有交易申请才有
    // }
    function addSystemMsg(data){
        if(!chatCache.chatDic.hasOwnProperty($rootScope.SYSTEM_MSG_ID))
        {
            //创建系统消息
            chatCache.chatDic[$rootScope.SYSTEM_MSG_ID]={
              chatRecords: [],
              userInfo: {
                user_id: $rootScope.SYSTEM_MSG_ID,
                userNameRespect: "系统消息"
              },
              unReadNum: 0
            };
        }
        data.has_read = false;
        chatCache.chatDic[$rootScope.SYSTEM_MSG_ID].chatRecords.unshift(data);
        chatCache.chatDic[$rootScope.SYSTEM_MSG_ID].unReadNum++;
        updateUnReadMsgNumber();
        //更新聊天顺序队列
        updateChatOrderListOnAdd($rootScope.SYSTEM_MSG_ID);
        //判断系统消息记录是否超出
        isChatRecordOverflow($rootScope.SYSTEM_MSG_ID);
    }

    /**
     * 添加发送的消息记录
     * @param chat_user_id 聊天的用户id
     * @param data  聊天数据
     */
    function addSendChatRecord(chat_user_id,data){
        //当该用户的聊天记录已经存在时
        if(chatCache.chatDic.hasOwnProperty(chat_user_id))
        {
            //对图像类型的数据进行处理
            if(data.type==$rootScope.MSG_TYPE.IMG)
            {
                ImgPathService.generateChatImgUrl(data);
            }
            chatCache.chatDic[chat_user_id].chatRecords.push(data);

            //更新聊天顺序队列
            updateChatOrderListOnAdd(chat_user_id);
            //判断与该用户的聊天记录是否超出
            isChatRecordOverflow(chat_user_id);
            saveChatDic($rootScope.userInfo.user_id);
        }
        else
        {
            console.error('与该用户的聊天记录不存在');
        }
    }

    /**
     *  获取与目标用户的聊天记录
     * @param chatUserInfo object 目标用户信息
     * @returns {*} 聊天记录或者空数组
     */
    function getChatContentByChatUserId(chatUserInfo)
    {
        //当该用户的聊天记录已经存在时
        if(chatCache.chatDic.hasOwnProperty(chatUserInfo.user_id))
        {
            //将未读消息数量置为0
            chatCache.chatDic[chatUserInfo.user_id].unReadNum=0;
            updateUnReadMsgNumber();
            return chatCache.chatDic[chatUserInfo.user_id];
        }
        else
        {
            //创建与该用户的聊天记录
            chatCache.chatDic[chatUserInfo.user_id]={
                chatRecords: [],
                userInfo: {
                    user_id: chatUserInfo.user_id,
                    userNameRespect: chatUserInfo.userNameRespect,
                    avatars_name: chatUserInfo.avatars_name,
                    level: chatUserInfo.level
                },
                unReadNum: 0
            };

            return chatCache.chatDic[chatUserInfo.user_id];
        }
    }

    /**
     * 获取系统消息
     * @returns {*}
     */
    function getSystemMsgs()
    {
        if(chatCache.chatDic.hasOwnProperty($rootScope.SYSTEM_MSG_ID))
        {
            return chatCache.chatDic[$rootScope.SYSTEM_MSG_ID].chatRecords;
        }
        else
        {
            return null
        }
    }

    /**
     * 获取发送过来的消息的处理
     * @param obj
     */
    function recevieMessage(obj)
    {
        if(obj.target_id == $rootScope.userInfo.user_id)
        {
            if(obj.type == $rootScope.MSG_TYPE.APPLICATION) {
                // 接收到交易申请,插入一条系统消息
                //添加系统消息
                addSystemMsg(obj);
            }
            else {
                isChatTargetHasExistOnReceive(obj);
                //添加聊天记录
                addReceivedChatRecord(obj.src_id,obj);
            }
          //保存聊天记录
          saveChatDic($rootScope.userInfo.user_id);
        }
        else
        {
            console.log("接受到非本id为目标的信息");
        }
    }

    /**
     * 判断接收到的消息的用户是否已经在字典中有与该用户聊天记录
     * @param msg
     */
    function isChatTargetHasExistOnReceive(msg){
        if(!chatCache.chatDic.hasOwnProperty(msg.src_id))
        {
            //与该用户的聊天信息不存在时，创建新的记录，并保存相关数据
            chatCache.chatDic[msg.src_id]={
                chatRecords: [],
                userInfo: {
                    user_id: msg.src_id,
                    userNameRespect: msg.userNameRespect,
                    avatars_name: msg.avatars_name,
                    level: msg.src_level
                },
                unReadNum: 0
            };
        }
    }

    /**
     * 批量接收到消息，该函数用于用户登录时获取离线期间的消息数据，批量接收时，需要所有消息都接收完成后才一次性存储
     * @param msgs
     */
    function receviceMsgArray(msgs){
        for(var i=0;i<msgs.length;i++)
        {
            if(msgs[i].target_id == $rootScope.userInfo.user_id)
            {
                isChatTargetHasExistOnReceive(msgs[i]);
                //添加聊天记录
                addReceivedChatRecord(msgs[i].src_id,msgs[i]);
            }
            else
            {
                console.log("接受到非本id为目标的信息");
            }
        }

        //保存聊天记录
        saveChatDic($rootScope.userInfo.user_id);
    }


    /**
     * 计算并更新整体的未阅读的消息数量
     */
    function updateUnReadMsgNumber(){
        if(!isChatDicEmpty())
        {
            $rootScope.UnReadMsgNum=0;
            for(var key in chatCache.chatDic)
            {
                $rootScope.UnReadMsgNum+=chatCache.chatDic[key].unReadNum;
            }
        }
    }

    /**
     * 判断当前的聊天记录是否为空
     * @returns {boolean} 返回是否为空
     */
    function isChatDicEmpty(){
        for (var key in chatCache.chatDic) {
            return false;
        }
        return true;
    }

    function removeSubChatUnReadNum(chat_user_id){
        if(chatCache.chatDic.hasOwnProperty(chat_user_id))
        {
            chatCache.chatDic[chat_user_id].unReadNum=0;
            updateUnReadMsgNumber();
        }
    }

    /**
     * 保存当前的聊天记录，原本设计为在用户退出登录和关闭程序时调用，现在由于强制关闭软件的可能性，将其改为每接受到一次数据就存储一次，
     * 这种方法当数据量巨大时会出现性能瓶颈，比如在历史聊天记录加起来有1000条时，存储时间15ms
     */
    function saveChatDic(user_id){
        var chat_key=chat_pre+user_id;
        LocalStorage.setObject(chat_key,chatCache);
    }

    /**
     * 清空当前的聊天记录，在用户退出登录时调用
     */
    function resetCurrentChatCache(){
        //重置chatCache
        chatCache={
            chatDic: {},
            chatOrderList: [],
            chatLastIdReceive: null
        };
    }

    /**
     * 将自己发送的消息的状态置为成功
     * @param msg 传入的msg，主要通过目标id，发送时间来确认
     * @return
     */
    function setMsgSendSuccess(msg){
        setMsgSendState(msg,$rootScope.MSG_SEND_STATE.SUCCESS);
    }


    function setMsgSendFailed(msg){
        setMsgSendState(msg,$rootScope.MSG_SEND_STATE.FAILED);
    }


    function setMsgSendState(msg,state)
    {
        var target_id=msg.target_id;
        var create_time_local=msg.msg_create_time_local;

        if(chatCache.chatDic.hasOwnProperty(target_id))
        {
            console.log(chatCache.chatDic[target_id]);
            //从后向前遍历数组，找对应的创建时间
            for(var i=chatCache.chatDic[target_id].chatRecords.length-1;i>=0;i=i-1)
            {
                //时间对应，且是自己发的，则置为成功
                if(chatCache.chatDic[target_id].chatRecords[i].msg_create_time_local==create_time_local &&
                    chatCache.chatDic[target_id].chatRecords[i].src_id==$rootScope.userInfo.user_id &&
                    chatCache.chatDic[target_id].chatRecords[i].content==msg.content)
                {
                    chatCache.chatDic[target_id].chatRecords[i].send_state=state;
                    delete chatCache.chatDic[target_id].chatRecords[i].msg_create_time_local;
                    chatCache.chatDic[target_id].chatRecords[i].msg_create_time=msg.msg_create_time;
                    //存储聊天缓存
                    saveChatDic($rootScope.userInfo.user_id);
                    return;
                }
            }
            console.error("该消息根本不存在,无法置为发送成功");
            console.error(msg);
        }
        else
        {
            console.error("该消息根本不存在,无法置为发送成功");
            console.error(msg);
        }
    }

    /**
     * 清空用户当前聊天记录和本地聊天缓存
     */
    function clearAllChatCache(){
        resetCurrentChatCache();
        var chat_key=chat_pre+$rootScope.userInfo.user_id;
        LocalStorage.setObject(chat_key,chatCache);
    }

    /**
     * 清楚与目标用户的聊天记录
     * @param target_id
     */
    function clearChatCacheOfTarget(target_id){
        if(chatCache.chatDic.hasOwnProperty(target_id))
        {
            delete chatCache.chatDic[target_id];
            updateChatOrderListOnDelete(target_id);
            updateUnReadMsgNumber();
            saveChatDic($rootScope.userInfo.user_id);

        }
        else
        {
            console.error("要清除的目标用户根本不存在，target_id:"+target_id);
        }
    }

    //当添加聊天记录时调整用户在聊天队列中的顺序
    function updateChatOrderListOnAdd(user_id){
        //首先清楚聊天顺序列表中的该数据
        updateChatOrderListOnDelete(user_id);
        //该元素添加到数组的头部
        chatCache.chatOrderList.unshift(user_id);
        //当用户聊天记录的总列数超过50条时，删去最后一条
        if(chatCache.chatOrderList.length>MAX_CHAT_USER_RECORD)
        {
            var target_id=chatCache.chatOrderList[chatCache.chatOrderList.length-1];
            clearChatCacheOfTarget(target_id);
            console.log("聊天记录列表超出,已清除");
        }
    }

    function updateChatOrderListOnDelete(user_id)
    {
        for(var i=0;i<chatCache.chatOrderList.length;i++)
        {
            if(chatCache.chatOrderList[i]==user_id)
            {
                //从数组中清除该元素
                chatCache.chatOrderList.splice(i,1);
                return;
            }
        }
    }

    function getChatOrderList(){
        return chatCache.chatOrderList;
    }

    /**
     *检测用户的聊天记录是否超出限定值
     * @param target_id
     */
    function isChatRecordOverflow(target_id){
        if(chatCache.chatDic.hasOwnProperty(target_id))
        {
            if(chatCache.chatDic[target_id].chatRecords.length>MAX_CHAT_PER_USER)
            {
                //当于某用户的聊天记录超出限度时，每次删去一部分
                chatCache.chatDic[target_id].chatRecords.splice(0,RECORD_CLEAR_PER_TIME);
            }
        }
    }

    /**
     * 在读取本地聊天缓存时将所有等待结果的聊天记录状态置为failed
     */
    function changeWaitStateToFailedWhenReadCache(){
        for(var key in chatCache.chatDic)
        {
            for(var i=0;i<chatCache.chatDic[key].chatRecords.length;i++)
            {
                if(chatCache.chatDic[key].chatRecords[i].send_state==$rootScope.MSG_SEND_STATE.WAITING_RESULT)
                {
                    chatCache.chatDic[key].chatRecords[i].send_state=$rootScope.MSG_SEND_STATE.FAILED;
                }
            }
        }
    }

    /**
     * 删除与某用户的某条聊天记录，当前主要用于失败记录的清除
     * @param target_id
     * @param index
     */
    function deleteChatRecord(target_id,index){
        if(chatCache.chatDic.hasOwnProperty(target_id))
        {
            if(chatCache.chatDic[target_id].chatRecords.length>index)
            {
                chatCache.chatDic[target_id].chatRecords.splice(index,1);
            }
            else
            {
                console.error("要删除的聊天记录index超出当前数组长度");
            }
        }
        else
        {
            console.error("要删除的聊天记录所属的用户不存在");
        }
    }


    /**
     * 获取上次接收到的消息的ID
     * @returns {null}
     */
    function getLastIdReceive(){
        return chatCache.chatLastIdReceive;
    }

    /**
     * 进入聊天详情页面时，获取此时该显示的最新的20条记录的起始index
     * @param target_id int  目标用户id
     * @returns {number} 返回开始index
     */
    function getChatShowStartIndex(target_id){
        if(chatCache.chatDic.hasOwnProperty(target_id))
        {
            var ret=chatCache.chatDic[target_id].chatRecords.length-$rootScope.CHAT_RECORD_NUM;
            if(ret<0)
            {
                return 0;
            }
            else
            {
                return ret;
            }
        }
        else
        {
            return 0;
        }
    }

    /**
     * 通过index获取系统消息
     * @param index int 消息的index
     * @returns {*}
       */
    function getSystemMsgByIndex(index){
        if(chatCache.chatDic.hasOwnProperty($rootScope.SYSTEM_MSG_ID))
        {
            if(chatCache.chatDic[$rootScope.SYSTEM_MSG_ID].chatRecords.length >index){
                return chatCache.chatDic[$rootScope.SYSTEM_MSG_ID].chatRecords[index];
            }
        }
        return null;
    }

    return {
        readChatCache: readChatCache,
        addReceivedChatRecord: addReceivedChatRecord,
        getChatContentByChatUserId: getChatContentByChatUserId,
        getChatDic: getChatDic,
        recevieMessage: recevieMessage,
        removeSubChatUnReadNum: removeSubChatUnReadNum,
        saveChatDic: saveChatDic,
        resetCurrentChatCache: resetCurrentChatCache,
        addSendChatRecord: addSendChatRecord,
        setMsgSendSuccess: setMsgSendSuccess,
        clearAllChatCache: clearAllChatCache,
        clearChatCacheOfTarget: clearChatCacheOfTarget,
        getChatOrderList: getChatOrderList,
        deleteChatRecord: deleteChatRecord,
        setMsgSendFailed: setMsgSendFailed,
        getLastIdReceive: getLastIdReceive,
        receviceMsgArray: receviceMsgArray,
        getChatShowStartIndex: getChatShowStartIndex,
        getSystemMsgs: getSystemMsgs,
        getSystemMsgByIndex: getSystemMsgByIndex
    }


});
