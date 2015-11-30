var Constants = {
    USER: "userInfo",
    QVIEWS: "qviews",
    CENTER_VIEWS: "centerviews"
}
var ApplaneController = {

    init: function () {
        this.session = new Session();
        return this;
    },
    loadUser: function (sessionId) {

        return this.getDataFromRemoteService("/rest/user", sessionId).then(function (userInfo) {
            this.session[Constants.USER] = userInfo.user;
            this.session[Constants.QVIEWS] = userInfo.qviews;
        }).catch(function (e) {

            });

    },
    signout: function () {
        //do signout
    },
    loadView: function (view, target, mode) {

        return this.getDataFromRemoteService("/rest/view", view).then(function (viewInfo) {
            if (mode === "set") {
                this.session[target] = [viewInfo];
            }else if (mode === "push") {
                this.session[target].push(viewInfo) ;

            }
        })
    },
    getDataFromRemoteService: function (url, params) {
        if (url == "/rest/user") {
            var d = Q.defer();
            d.resolve({user: {name: "Rohit"}, qviews: [
                {id: "inbox", label: "Inbox"},
                {id: "active", label: "Active"}
            ]});
            return d.promise;
        } else if (url == "/rest/view") {
            var d = Q.defer();
            d.resolve({
                viewOptions: {
                    label: "Inbox",
                    fields: [
                        {label: "Task", field: "task", visibilityGrid: true, visibilityForm: true, type: "string", ui: "text"},
                        {label: "Owner", field: "owner_id", visibilityGrid: true, visibilityForm: true, type: "fk", ui: "autocomplete", displayField: "name"},
                        {label: "Created On", field: "createdOn", visibilityGrid: false, visibilityForm: false, type: "date", ui: "date"}
                    ],
                    insertView: {id: "new_task"},
                    delete: false,
                    navigation: true,
                    edit: false
                },
                data: {
                    result: [
                        {_id: 1, task: "meteor js sample", owner_id: {_id: "r", name: "Rohit"},createdOn:}
                    ],
                    aggregateResult: {}
                }
            });
            return d.promise;
        }
        var data = {};
        return http.post(url, params);
    }

}