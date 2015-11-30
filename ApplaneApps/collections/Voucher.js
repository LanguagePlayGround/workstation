exports.Vouchers = {
    collection:"vouchers",
    fields:[
        {field:"voucher_no"},
        {
            field:"voucher_date",
            default:{
                when:["$insert"],
                code:"return new Date();"
            }
        }
    ]

}