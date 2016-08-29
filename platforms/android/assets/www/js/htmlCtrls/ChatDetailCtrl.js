/**
 * Created by wujin on 2015/10/21.
 * 聊天细节的控制器
 */
rootModule.controller('ChatDetailCtrl', function($scope, $stateParams, Chats,$rootScope,$ionicActionSheet,CameraService,ChatCacheService,SocketService,
                                                $cordovaCamera,$ionicScrollDelegate,$ionicPlatform,$cordovaFileTransfer,$ionicModal,
                                                ImageService,$ionicPopup,$ionicLoading,$http,$cordovaToast,$q,$state) {

    //判断聊天记录是否需要显示时间,同时定义不同的显示方式，如果不是同一天的，显示日期，如果是同一天的只显示时间
    //0 ：表示不显示时间
    //1:  显示完整时间 YYYY-MM-DD HH-MM-SS
    //2:  只显示时间 HH-MM-SS

    var MAX_MINUTES_INTERVAL=5;  //最大显示时间，超过5分钟即显示
    $scope.needToShowTime=[];//记录每条聊天记录是否需要显示时间

    //计算聊天记录的间的时间是否应该显示
    var CalculateTimeShowState=function()
    {
        var currtime = $rootScope.getNowFormatDate();
        var currdate = currtime.substr(0,10);
        for(var index=0;index<$scope.chatShowList.length;index++)
        {

            if(index==0)
            {
                if($scope.chatShowList[index].hasOwnProperty('msg_create_time'))
                {
                    $scope.needToShowTime[index]=1;
                    continue;
                }
                else
                {
                    $scope.needToShowTime[index]=0;
                    continue;
                }

            }
            //该元素本身，或者该元素的前一条聊天记录都没有创建时间，则不显示时间
            if(!$scope.chatShowList[index].hasOwnProperty('msg_create_time') ||
                !$scope.chatShowList[index-1].hasOwnProperty('msg_create_time'))
            {
                $scope.needToShowTime[index]=0;
                continue;
            }
            var create_time_last=$scope.chatShowList[index-1].msg_create_time;
            var create_time_now=$scope.chatShowList[index].msg_create_time;
            if(create_time_last.substr(0,10)!=create_time_now.substr(0,10))//比较日期
            {
                $scope.needToShowTime[index]=1;
            }
            else
            {
                var hour_last=create_time_last.substr(11,2);
                var minute_last=create_time_last.substr(14,2);
                var hour_now=create_time_now.substr(11,2);
                var minute_now=create_time_now.substr(14,2);
                var minute_diff=Number(hour_now)*60+Number(minute_now)-Number(hour_last)*60-Number(minute_last);
                if(minute_diff > MAX_MINUTES_INTERVAL)
                {
                    //间隔过长,需要显示时间,近一步判断是否是今天
                    if(currdate == create_time_now.substr(0,10))
                    {
                        $scope.needToShowTime[index]=2;
                    }
                    else
                    {
                        $scope.needToShowTime[index]=1;
                    }

                }
                else
                {
                    $scope.needToShowTime[index]=0;
                }
            }
        }
    };

    //获取对方用户信息
    $scope.chatUserInfo=$rootScope.chatUserInfo;
    $scope.chatDetail=ChatCacheService.getChatContentByChatUserId($scope.chatUserInfo);
    console.log($scope.chatDetail);

    //以下是聊天数据分页显示的逻辑，用户首次进入时，获取最新的20条聊天数据，之后记录获取的聊天记录的start_id，每次上拉刷新获取更多的聊天记录
    $scope.record_start_index=ChatCacheService.getChatShowStartIndex($scope.chatUserInfo.user_id);


    /**
     * 刷新页面显示的聊天记录列表,每次当聊天记录发生变化或者主动主动获取更多时调用
     */
    var updateChatShowList=function(){
        if($scope.record_start_index==0)
        {
            $scope.chatShowList=angular.copy($scope.chatDetail.chatRecords);
        }
        else
        {
            $scope.chatShowList=$scope.chatDetail.chatRecords.slice($scope.record_start_index);
        }
        //计算是否需要显示时间
        CalculateTimeShowState();
        console.log($scope.chatShowList);
    };
    updateChatShowList();


    $scope.getMoreChatRecord=function(){
        if($scope.record_start_index==0)
        {
            $scope.$broadcast('scroll.refreshComplete');
            $cordovaToast.showShortCenter("暂无更多历史记录");
            return;
        }
        $scope.record_start_index-=$rootScope.CHAT_RECORD_NUM;
        if($scope.record_start_index<0)
        {
            $scope.record_start_index=0;
        }
        updateChatShowList();
        $scope.$broadcast('scroll.refreshComplete');
    };


    //+号按钮的弹出菜单
    $scope.showActionSheet = function() {
        // Show the action sheet
        var hideSheet = $ionicActionSheet.show({
            buttons: [
                { text: '<b>拍照</b>' },
                { text: '<b>相册</b>' }
            ],
//            destructiveText: 'Delete',
            titleText: '<b>图片发送</b>',
            cancelText: '<b>取消</b>',
            cancel: function() {
                // add cancel code..
            },
            buttonClicked: function(index) {

                //这边直接获取文件的数据，而不是获取URI，这样压缩代码就可以直接根据数据进行图像压缩，这样可以避免安卓系统中uri和真是路径之间的转换
                //但是，这种做法一定程度导致内存占用过多，可能导致软件被系统直接kill掉的情况，目前暂未发现，以后再测试的时候再说
                var options=CameraService.ImgDataOptionsGenerate(index);
                $cordovaCamera.getPicture(options).then(function(imageData) {
                    //console.log(imageUrl);
                    var imgData={
                        thumbnail:null,
                        origin: null
                    };
                    //压缩出缩略图后，保存起来
                    ImageService.resizeImgWithBase64Data(imageData,$rootScope.IMG_RESIZE_SIZE.THUMBNAIL)
                    .then(function(result){
                            imgData.thumbnail=result;
                            //是否两个图像都压缩完成
                            if(imgData.origin!=null)
                            {
                                uploadImagesInBase64(imgData);
                            }
                        },function(err){

                        });
                    //压缩出原图
                    ImageService.resizeImgWithBase64Data(imageData,$rootScope.IMG_RESIZE_SIZE.ORIGIN)
                    .then(function(result){
                        imgData.origin=result;
                        //是否两个图像都压缩完成
                        if(imgData.thumbnail!=null)
                        {
                            uploadImagesInBase64(imgData);
                        }

                    },function(err){

                    });
                    //这边应该先检查下图片的情况，然后进行压缩，先不做，直接传给服务器
                    //uploadImages(imageUrl);
                    //console.log($scope.imgUrls);
                });
                return true;
            }
        });

    };


//
    //用于监控是否有输入内容，根据内容动态变幻按钮，没有内容时为＋号，有内容时为发送按钮
    $scope.hasContent=false;
    $scope.$watch("chatStr",function(newValue){

            if(typeof(newValue)!="undefined")
            {
                if(newValue.length===0)
                {
                    $scope.hasContent=false;
                }
                else
                {
                    $scope.hasContent=true;
                }
            }
        }
    );
//
    window.addEventListener('native.keyboardshow', keyboardShowHandler);
    window.addEventListener('native.keyboardhide', keyboardHideHandler);
    //点击和隐藏输入框后都跳转到底部
    function keyboardShowHandler(e){
//        alert('Keyboard height is: ' + e.keyboardHeight);
        $ionicScrollDelegate.scrollBottom();
    }
    function keyboardHideHandler(e){
        $ionicScrollDelegate.scrollBottom();
    }

//
    $scope.sendMessage=function(Str){
//        Chats.add({
//            id: 5,
//            name: 'Mike Harrington',
//            lastText: Str,
//            face: 'img/touxiang5.jpg',
//            unRead: 0
//        });
        //发送后输入框清空并跳转到底部
        SocketService.sendMessage(Str,$scope.chatUserInfo.user_id,$rootScope.MSG_TYPE.TEXT);
        //先不管是否发送成功，直接展示在页面上
        $scope.chatStr="";
        $ionicScrollDelegate.scrollBottom();
    };
//
    //点击输入框后跳转到对话底部
    $scope.toBottom=function(){
        $ionicScrollDelegate.scrollBottom();
    };




    //监控登录的状态
    $scope.isConnected=SocketService.isConnected();

    $scope.$watch(function(){
        return SocketService.isConnected();
    },function(newValue){
        console.log(newValue);
        $scope.isConnected=newValue;
    });


    $scope.$on('$ionicView.beforeEnter',function(){
        $rootScope.checkLogin();
//        ChatCacheService.removeSubChatUnReadNum($scope.chatUserInfo.user_id);
        //每次进来都刷新一下聊天数据
        $scope.chatDetail=ChatCacheService.getChatContentByChatUserId($scope.chatUserInfo);
    });

    $scope.$on('$ionicView.afterEnter',function(){
        $ionicScrollDelegate.resize();
        $scope.toBottom();
    });

    var updateRecords = function(){
      console.log("更新页面");
      updateChatShowList();
      $ionicScrollDelegate.resize();
      $scope.toBottom();
      //暂时通过刷新的方式解决了旧手机中接收到消息之后页面不刷新的问题
      //$state.reload();
    };

    //多角度监控本地的聊天记录是否改变，一旦改变，更新数据
    $scope.$watch(function(){
        return $scope.chatDetail.chatRecords.length;
    },function(newValue){
        updateRecords();
    });

    $scope.$watch(function(){
        //计算length和含有create_time的元素的和，这样对于自己发送的消息，在确认消息发送成功后其时间也能正确显示
        var create_time_count=0;
        for(var i=0;i<$scope.chatDetail.chatRecords.length;i++)
        {
          // 只有发送成功和接收到的消息才会有msg_create_time字段
          if($scope.chatDetail.chatRecords[i].hasOwnProperty('msg_create_time'))
          {
            create_time_count++;
          }
        }
        return  create_time_count;
    },function(newValue){
        updateRecords();
    });

    $scope.$watch(function(){
        var failed_count = 0;
        for(var i=0;i<$scope.chatDetail.chatRecords.length;i++)
        {
          if($scope.chatDetail.chatRecords[i].send_state == $rootScope.MSG_SEND_STATE.FAILED)
          {
            failed_count++;
          }
        }
        return failed_count;
    },function(newValue){
        updateRecords();
    });



    $scope.onClickFailed=function(index){
        console.log(index);
        $ionicPopup.confirm({
            title: '私信发送失败',
            template: '由于网络问题，该私信发送失败，是否重新发送',
            cancelText: '取消',
            okText: '重新发送'
        }).then(function(result){
            var target_id=$scope.chatShowList[index].target_id;
            //避免删除后没有了，先将信息拷贝下来
            var msg=angular.copy($scope.chatShowList[index]);
            ChatCacheService.deleteChatRecord(target_id,index+ $scope.record_start_index);
            if(result){
                //重发
                SocketService.msgResend(msg);
            }
            else{
                //取消重发
            }
        });
    };

    //先做在线交流
    //之后做本地缓存
    //最后做数据库联接
    //图片发送，图片本地缓存
    //聊天时间的判断和显示

//    该函数直接上传图像，没有压缩，暂时废弃
//    var uploadImages=function(imgUrl){
//        $ionicLoading.show("图像上传中...");
//        var server='https://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Upload/uploadChatImages';
//        var options={};
//        $cordovaFileTransfer.upload(server, imgUrl, options,true)
//            .then(function(result) {
//                console.log(result);
//                SocketService.sendMessage(result.response,$scope.chatUserInfo.user_id,$rootScope.MSG_TYPE.IMG);
//                // Success!
//            }, function(err) {
//                console.log("图片上传失败");
//                console.log(err);
//
//            }, function (progress) {
//                //在此可以加入实名认证的进度条，后期工作
//                // constant progress updates
//                //console.log(progress);
//            }).finally(function(){
//                $ionicLoading.hide();
//            });
//    };


    var uploadImagesInBase64=function(imgData){
        $ionicLoading.show({
            templateUrl: 'templates/uploading.html'
        });
        var url='https://'+$rootScope.SERVER_ADDRESS+'/'+$rootScope.ENTER_FILE+'/User/Upload/uploadChatImgInBase64';
        $http({
            method: 'PUT',
            url: url,
            data: imgData
        }).
            success(function(data, status, headers, config)
            {
                switch (status)
                {
                    case 200:
                        console.log(data);
                        SocketService.sendMessage(data,$scope.chatUserInfo.user_id,$rootScope.MSG_TYPE.IMG);
                        break;
                }
            }).
            error(function(data, status, headers, config)
            {
                switch(status){
                    case 400:
                        $cordovaToast.showShortCenter("文件存储失败");
                        break;
                    default:
                        $cordovaToast.showShortCenter("网络连接暂不可用");
                        break;
                }
                $scope.isFocused=true;
            })
            .finally(function(){
                $ionicLoading.hide();
            });
    };




    $scope.onClickImg=function(imgUrl){
        $scope.img_scroll=imgUrl;
        //定义模态页面
        $ionicModal.fromTemplateUrl('templates/img_scroll.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.scroll_modal = modal;
            $scope.scroll_modal.show();
        });

    };

    $scope.closeModal=function(){
        $scope.scroll_modal.hide();
        $scope.scroll_modal.remove();
    };










});
