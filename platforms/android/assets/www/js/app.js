// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('ZhangYouBao', ['ionic', 'ZhangYouBao.controllers', 'ZhangYouBao.services',
    'ZhangYouBao.directives','ngCordova','imageCacheFactory','autoFocus','btford.socket-io'])

.run(function($ionicPlatform,$rootScope,$ionicHistory,$state,LoginoutService,ChatCacheService,
              NetworkStateService,TradeTypeService,$cordovaNativeAudio, $ionicPopup) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
    //测试网络状态和自动登录
    if(NetworkStateService.checkConnection())
    {
      console.log("准备调用自动登录");
      //自动登录
      LoginoutService.loginWithLastInfo();
      //获取服务器分区列表信息
      TradeTypeService.getItemSubtypesFromServer();
    }
    //加载音频
    $cordovaNativeAudio
      .preloadSimple('new_message', 'audio/new_message.mp3')
      .then(function (msg) {
        console.log(msg);
      }, function (error) {
        alert(error);
      });
  });

  //用于一些全局变量的初始化
  $rootScope.isLogin=false;  //记录当前用户是否登录
  $rootScope.msgResendSeconds=60; //60s才能重发验证码
  $rootScope.msgResendRemain=0;//剩余的重发秒数
  $rootScope.maxCardNum=2;//最大支持的银行卡数
  //用于标记是否进行了强制登录，如果强制登录了，那么登录成功后需要跳转回来
  $rootScope.forceLogin=false;

  $rootScope.MAX_FOCUS_NUMBER=20;//用户挂单和商铺的分别最大收藏数
  $rootScope.LOADING_MIN_TIME=500;//加载动画的最短时间，避免过短影响用户体验
//  $rootScope.SERVER_ADDRESS="169.254.123.63/html"; //服务器地址，目前使用IP，之后可能会换成域名
  $rootScope.SERVER_ADDRESS="115.28.95.58";
  $rootScope.ENTER_FILE="zhangyoubao.php";//入口函数

  $rootScope.CHAT_SERVER_PORT="63238";

  //关于审核状态的常量
  $rootScope.VERIFY_STATE={
      UNCOMMIT: 0,  //未提交
      COMMITED: 1,  //待审核
      PASSED_VERIFY: 2,  //审核通过
      REJECTED: 3 //审核失败
  };

  //關於店鋪狀態的常量
  $rootScope.STORE_STATE={
        NORMAL: 0,  //正常
        TEMP_OFF: 1,  //暂时停运
        FORBIDDEN: 2  //封号
    };

  //定义商品呈现的排序方式
  $rootScope.SORT_TYPE={
      RELEVANCE: 0,
      TIME: 1,
      VISIT: 2
  };

  //定义聊天消息的类型
  $rootScope.MSG_TYPE={
      TEXT: 0,
      IMG: 1,
      APPLICATION: 2,
      APPLY_ACCEPTED: 3,
      APPLY_REJECTED: 4
  };


  $rootScope.MSG_SEND_STATE={
      WAITING_RESULT: 0,
      SUCCESS: 1,
      FAILED: 2
  };

  $rootScope.IMG_RESIZE_SIZE={
      THUMBNAIL : 200,
      ORIGIN:     1000
  };

  //本地通知的不同类别对应的ID
  $rootScope.LOCAL_NOTIFY_ID={
      MESSAGE: 1,
      SYSTEM_NOTIFY: 2
  };

  $rootScope.USER_LEVEL={
      NORMAL: 0, //普通用户
      VIP: 1, //会员
      STORE_OWNER: 2  //实体店主
  };
  //交易付款类型
  $rootScope.TRANS_TYPE={
      GOODS_FIRST: 1, //先货后款
      MONEY_FIRST: 2  //先款后货
  };

  $rootScope.TRANSACTION_APPLY_STATUS={
      APPLYING: 1,
      ACCEPTED: 2,
      COMPLETED: 3,
      REJECTED: 4,
      ERROR: 5
  };
  // 用于记录一些异步请求的状态,从而对异步请求进行相应
  $rootScope.ASYNC_STATUS={
    APPLYING: 1,
    SUCCESS: 2,
    FAILED: 3
  };
  // 在消息记录中系统消息对应的id
  $rootScope.SYSTEM_MSG_ID = 0;



  //每次获取列表时单项的数量
  $rootScope.GET_LIST_NUM=10;
  $rootScope.GET_SEARCH_NUM=10;
  //每次获取的聊天记录的数量
  $rootScope.CHAT_RECORD_NUM=10;
  //定义一个全局函数，该函数用于部分页面左上角的返回按钮
  $rootScope.goBack=function(){
      $ionicHistory.goBack();
  };
  //清空history
  $rootScope.clearHistory=function(){
      $ionicHistory.clearHistory();
  };
  //检测是否登录，没有登录则强制跳转到登录页面
  $rootScope.checkLogin=function(){
      if(!$rootScope.isLogin)
      {
          //强制登录
          $rootScope.forceLogin=true;
          $state.go("login");
      }
  };
  //用于创建一个固定大小的数组
  $rootScope.range=function(num){
      return new Array(num);
  };


   //用于设置android返回键
    $ionicPlatform.registerBackButtonAction(function (event) {

        switch ($ionicHistory.currentStateName())
        {
            case "login":
                $state.go("tab.home");
                break;
            case "tab.home":
                //记录当前的聊天记录到本地缓存
                if($rootScope.isLogin) {
                  ChatCacheService.saveChatDic($rootScope.userInfo.user_id);
                }
                // unload当前加载的音频
                $cordovaNativeAudio.unload('new_message');
                //在主页面按返回键，直接退出
                ionic.Platform.exitApp();
                break;
            case "certification":
                //在实名认证页面，返回account页面
                $state.go("tab.account");
                break;
            default :
                $ionicHistory.goBack();
                break;
        }
    }, 100);

    //应用开启时候的一些功能调用
    //测试网络状态和自动登录
    //$ionicPlatform.ready(function() {
    //    if(NetworkStateService.checkConnection())
    //    {
    //        console.log("准备调用自动登录");
    //        //自动登录
    //        LoginoutService.loginWithLastInfo();
    //        //获取服务器分区列表信息
    //        TradeTypeService.getItemSubtypesFromServer();
    //    }
    //});


    $rootScope.getNowFormatDate=function() {
        var date = new Date();
        var seperator1 = "-";
        var seperator2 = ":";
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        var hours=date.getHours();
        var minutes=date.getMinutes();
        var seconds=date.getSeconds();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        if (hours >= 0 && hours <= 9) {
            hours = "0" + hours;
        }
        if (minutes >= 0 && minutes <= 9) {
            minutes = "0" + minutes;
        }
        if (seconds >= 0 && seconds <= 9) {
            seconds = "0" + seconds;
        }

        var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + hours + seperator2 + minutes
            + seperator2 + seconds;
        return currentdate;
    };

    //程序是否在前台运行
    $rootScope.isActive=true;
    $ionicPlatform.on("pause", function(event) {
        // user put the app in the background
        console.log("background");
        $rootScope.isActive=false;
    });

    $ionicPlatform.on("resume", function(event) {
        // user opened the app from the background
        console.log("active");
        $rootScope.isActive=true;
    });
    // 检测用户是否已经实名认证通过
    $rootScope.isCertified=function(){
        if ($rootScope.userInfo) {
            switch (Number($rootScope.userInfo.certify_state)) {
                case $rootScope.VERIFY_STATE.UNCOMMIT: //未测试
                case $rootScope.VERIFY_STATE.REJECTED: //未测试
                    $ionicPopup.confirm({
                      title: '实名认证提示',
                      template: '本平台为实名制交流平台,该功能需要实名认证通过后才能使用',
                      cancelText: '确认',
                      okText: '前去认证'
                    }).then(function(result){
                      if(result){
                        $state.go("tab.account");
                      }
                    });
                    return false;
                case $rootScope.VERIFY_STATE.COMMITED: //未测试
                    $ionicPopup.alert({
                      title: '实名认证提示',
                      template: '本平台为实名制交流平台,该功能需要实名认证通过后才能使用,您的认证申请正在审批中,我们将尽快为您处理',
                      okText: '确认'
                    });
                    return false;
                case $rootScope.VERIFY_STATE.PASSED_VERIFY: //测试通过
                    return true;
            }

        }
    };

  //检测该挂单是否是用户自己的
  $rootScope.detectIsSelf=function(id){
      if(id==$rootScope.userInfo.user_id)
      {
        $cordovaToast.showShortCenter("无法对自己进行该操作");
        return true;
      }
      else
      {
        return false;
      }
  }


})


.config(function($stateProvider, $urlRouterProvider,$ionicConfigProvider) {
  //设置tab栏在应用底部显示
  $ionicConfigProvider.platform.ios.tabs.style('standard');
  $ionicConfigProvider.platform.ios.tabs.position('bottom');
  $ionicConfigProvider.platform.android.tabs.style('standard');
  $ionicConfigProvider.platform.android.tabs.position('standard');

  $ionicConfigProvider.platform.ios.navBar.alignTitle('center');
  $ionicConfigProvider.platform.android.navBar.alignTitle('left');

  $ionicConfigProvider.platform.ios.backButton.previousTitleText('').icon('ion-ios-arrow-thin-left');
  $ionicConfigProvider.platform.android.backButton.previousTitleText('').icon('ion-android-arrow-back');

  $ionicConfigProvider.platform.ios.views.transition('ios');
  $ionicConfigProvider.platform.android.views.transition('android');
  //设置导航标题居中
  $ionicConfigProvider.navBar.alignTitle('center');
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:
  //定义tab路由
  .state('tab.home', {
    url: '/home',
    views: {
       'tab-home': {
         templateUrl: 'templates/tab-home.html',
         controller: 'HomeCtrl'
       }
    }
  })

    .state('search', {
        url: '/search',
        templateUrl: 'templates/search.html',
        controller: 'SearchCtrl'
    })



    .state('tab.category', {
        url: '/category',
        views: {
            'tab-category': {
                templateUrl: 'templates/tab-category.html',
                controller: 'CategoryCtrl'
            }
        }
    })
    .state('tab.help', {
        url: '/help',
        views: {
            'tab-help': {
                templateUrl: 'templates/tab-help.html',
                controller: 'HelpCtrl'
            }
        }
    })

  .state('tab.help-detail', {
      url: '/help/:helpItemId',
      views: {
          'tab-help': {
              templateUrl: 'templates/help-detail.html',
              controller: 'HelpDetailCtrl'
          }
      }
  })

  .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-chats.html',
          controller: 'ChatsCtrl'
        }
      }
    })
   //这边传入这个id是为了不同的用户聊天对应不同的页面，从而可以进行页面缓存
    .state('chat-detail', {
      url: '/chat-detail/:chat_user_id',
      templateUrl: 'templates/chat-detail.html',
      controller: 'ChatDetailCtrl'

    })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  })

  .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl'
  })
  .state('registe', {
      url: '/registe',
      templateUrl: 'templates/registe.html',
      controller: 'RegisteCtrl'
  })

  .state('certification', {
      url: '/certification',
      templateUrl: 'templates/certification.html',
      controller: 'CertificationCtrl'
  })

  .state('bankChoose', {
      url: '/bankChoose/:bankCardId',
      templateUrl: 'templates/bank-choose.html',
      controller: 'BankChooseCtrl'
  })

  .state('trade-detail',{
          url: '/trade',
          templateUrl: 'templates/trade-detail.html',
          controller: 'TradeDetailCtrl'
      }
  )

  .state('store-detail',{
      url: '/store',
      templateUrl: 'templates/store-detail.html',
      controller: 'StoreDetailCtrl'
  })

  .state('vip-state',{
          url: '/vipState',
          templateUrl: 'templates/vip-state.html',
          controller: 'VipStateCtrl'
  })

//  .state('card-manage',{
//      url: '/CardManage',
//      templateUrl: 'templates/card-manage.html',
//      controller: 'CardManageCtrl'
//  })

  .state('tab.account-card-manage',{
      url: '/account-card-manage',
      views: {
          'tab-account': {
              templateUrl: 'templates/card-manage.html',
              controller: 'CardManageCtrl'
          }
      }
  })

  .state('add-trade',{
      url: '/AddTrade',
      templateUrl: 'templates/add-trade.html',
      controller: 'AddTradeCtrl'
  })

  .state('transaction-apply',{
    url: '/transaction-apply/:chat_id/:status/:msg_index',
    templateUrl: 'templates/transaction-apply.html',
    controller: 'TransactionApplyCtrl'
  })

//  .state('store-manage',{
//      url: '/StoreManage',
//      templateUrl: 'templates/store-manage.html',
//      controller: 'StoreManageCtrl'
//  })

  .state('tab.account-store-manage',{
      url: '/account-store-manage',
      views: {
          'tab-account': {
              templateUrl: 'templates/store-manage.html',
              controller: 'StoreManageCtrl'
          }
      }
  })

  .state('store-register',{
      url: '/StoreRegister',
      templateUrl: 'templates/store-register.html',
      controller: 'StoreRegisterCtrl'
  })


  .state('tab.account-focus-manage',{
      url: '/account-focus-manage',
      views: {
          'tab-account': {
              templateUrl: 'templates/focus-manage.html',
              controller: 'FocusManageCtrl'
          }
      }
  })

  .state('system-msg-list',{
    url: '/system-msg-list',
    templateUrl: 'templates/system-msg-list.html',
    controller: 'SystemMsgListCtrl'
  })






  ;
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/home');

});
