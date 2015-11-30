function callKonnectV() {

    alert("callKonnectV")

    var query = {$collection:"pl.users"};
    var params = {code:"5393118e2777110200962c1c", query:JSON.stringify(query)};

    $.ajax({
        type:"POST",
        url:"http://sandbox.konnectv.applane.com/rest/query",
        data:params,
        success:function (returnData, status, xhr) {
            alert("Success>>>" + JSON.stringify(returnData));
        },
        error:function (jqXHR, exception) {
            alert("Error>>" + jqXHR.responseText)
        },
        timeout:1200000,
        dataType:"json",
        async:true,
        crossDomain:true
    });


}

function callKonnectV1() {

    alert("callKonnectV invoke")

    var parameters = [];
    var params = {code:"5393118e2777110200962c1c", "function":"SubscriberService.fullInstallationSubmitForm", parameters:JSON.stringify(parameters)};

    $.ajax({
        type:"POST",
        url:"http://sandbox.konnectv.applane.com/rest/invoke",
        data:params,
        success:function (returnData, status, xhr) {
            alert("Success>>>" + JSON.stringify(returnData));
        },
        error:function (jqXHR, exception) {
            alert("Error>>" + jqXHR.responseText)
        },
        timeout:1200000,
        dataType:"json",
        async:true,
        crossDomain:true
    });


}


function callKonnectV_Prototype() {
    alert("callKonnectV_Prototype");
    var params = {token:"539aa9a06343040200839397", query:JSON.stringify({$collection:"pl.users"})};

    Ajax.Responders.register({
        onCreate:function (response) {
            var t = response.transport;
            t.setRequestHeader = t.setRequestHeader.wrap(function (original, k, v) {
                if (/^(accept|accept-language|content-language)$/i.test(k))
                    return original(k, v);
                if (/^content-type$/i.test(k) &&
                    /^(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)(;.+)?$/i.test(v))
                    return original(k, v);
                return;
            });
        }
    });

    new Ajax.Request('http://sandbox.konnectv.applane.com/rest/query', {
        method:'post',
        parameters:params,
        onSuccess:function (transport) {
            alert(">>>>Transport>>>" + JSON.stringify(transport))
            var response = transport.responseJSON;
            alert(JSON.stringify(response));
        },
        onFailure:function () {
            alert('Something went wrong...');
        }
    });
}