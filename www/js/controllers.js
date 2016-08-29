//该文件用于存放一些比较简单的控制器逻辑
var rootModule = angular.module('ZhangYouBao.controllers',[])

.controller('DashCtrl', function($scope) {})



//全局控制器
.controller('TotalCtrl', function($scope,$state,$rootScope) {
    $rootScope.hideTabs=false;
});

