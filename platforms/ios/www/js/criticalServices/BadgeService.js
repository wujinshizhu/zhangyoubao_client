/**
 * Created by wujin on 16/7/22.
 * 该服务用于应用右上角的数字,尤其是iphone中,但是具体iphone中的效果需要进一步测试,
 *
 * 该服务在ngcordova中暂时不可用,留待以后解决
 */

rootService.factory('BadgeService',function($cordovaBadge) {
    /**
     * 该函数用于判断当前是否具有badge的权限,在打开软件时检测
     */
    var BADGE_PERMISSION = true;
    function hasBadgePerminsson () {
        $cordovaBadge.hasPermission().then(function(yes) {
            console.log(yes);
            BADGE_PERMISSION = true;
            // You have permission
        }, function(no) {
            BADGE_PERMISSION = false;
            console.log(yes);
            // You do not have permission
        });
    }

    function getBadgePermission() {
        return BADGE_PERMISSION;
    }

    return {
      hasBadgePerminsson: hasBadgePerminsson,
      getBadgePermission: getBadgePermission
    }
});
