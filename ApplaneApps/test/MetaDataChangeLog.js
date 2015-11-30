/**
afb
    afb_sb
pl.dbs

db                 sandbox_db           global_db       commit_db       auto_sync   is_sandbox      ensureDefaultCollection
afb                afb_sb                 -               -             false         false                  true
afb_sb             -                     afb             afb            true          true
daffodil           daffodil_sb           afb             -              true          false
daffodil_sb         -                   daffodil         daffodil       true          true
daffodil_hsr                            daffodil                        true          false
daffodil_hsr_applane                    daffodil_hsr      -             true          false
darcl              darcl_sb             afb               -             true          false
darcl_sb            -                   darcl            darcl          true          true
girnarsoft         girnarsoft_sb        afb               -             false         false
girnarsoft_sb        -                  girnarsoft       girnarsoft     false         true
daffodil_ggn         -                  daffodil          -             true          false


//getAdmiDB
      admin.update({$collection:"pl.dbs",$insert:[{}]})
//ApplanDB.connect - afb_sb
      add pl.applications - {label:"Task management"}
      add pl.menus  - {application:{$query:{label:"Task management"}},label:"Tasks",collection:tasks, index:10}
      add pl.collections : employees - name, code, age : number, salary : currency

      add fields to tasks - task, employeeid(set - [name], displayField:name), effort : duration
//commit from afb_sb to afb
//connect with afb
    expect - pl.applications
    expect - pl.roles - same name as of application
    expect pl.menus
    expect pl.collections - employees, tasks
    expect pl.fields - employees - name, code, age, salary - amount, type
    expect pl.fields - tasks - task, employeeid, effort - time,duration
        expect field count in tasks - 6
    expect pl.referredfks - tasks - one entry - collectionid:tasks, referredcollectonid:employees, field

    insert data in pl.currencies - {currency:"INR"}
    insert into employee - {name:"Ritesh afb",code:"ritesh afb",age:25,salary:{amount:10000,type:{$query:{currency:"INR"}}}}
        expect employees
    insert into tasks - {task:"t1",employeeid:{$query:{name:"Ritesh afb"}},effort:{10 Hrs}}
        expect - employeeid:{_id:xxxx,name:"Ritesh"}, effort :{coverted_value:600}
connect with afb_sb
    get pl.applications - label:"Task management"
    update - label :"Productivity"

    add menu - goals, index:20



commit to afb
connect to afb
    applications - expect label : Productivity
    menus - order by index - expect two - tasks, goals

daffodil - username:daffodil, password:daffodil
    add role to user
    pl.users - update, roles:{$insert:[{role:{$query:{role:"Task management"}}}]}
    insert data in pl.currencies - {currency:"INR"}
    insert into employee - {name:"Ritesh daffodil",code:"ritesh daffodil",age:25,salary:{amount:10000,type:{$query:{currency:"INR"}}}}
    expect employees
    insert into tasks - {task:"daffodil t1",employeeid:{$query:{name:"Ritesh daffodil"}},effort:{10 Hrs}}
    expect - employeeid:{_id:xxxx,name:"Ritesh daffodil"}, effort :{coverted_value:600}

connect with daffodil_sb - username:daffodil, password:daffodil
    insert data in pl.currencies - {currency:"INR"}
    insert into employee - {name:"Ritesh daffodil_sb",code:"Ritesh daffodil_sb",age:25,salary:{amount:10000,type:{$query:{currency:"INR"}}}}
    expect employees
    add menu - label:"Result" collection:result - comment:string, employeeid : fk [set:[name]], index:30, taskid:fk of task(no set field)
    update menu - goals - label - targets
commit to daffodil
connect with daffodil
    expect - pl.menus - tasks, target,  result
    insert into result -  {taskid:{$query:{task:"daffodil t1"}}, employeeid:{},comment:"follow up"}


connect with afb_sb

    pl.qviews
        insert -
            id:mytasks, tasks, label:"My tasks"
            id:alltasks, tasks, label:"All tasks"
    menu  -  tasks
        edit
            {$update:[{_id:"tasks..",$set:{qviews:{$insert:[{id:"",collection:"",label:""}]}}}]}
commit to afb
    get tasks menu and expect qviews  -3 qviews, tasks, mytasks, alltasks
connect with afb_sb
        pl.qviews :  insert -  id:overduetasks, tasks, label:"Overdue tasks"
        menu  -tasks

            change label of mytasks - mytodos
            delete all tasks
            insert - overduetasks

            {qviews:{$insert:[],$update:[],$delete:[]}}
    expect in tasks menu qviews - tasks, mytodos, overduetasks
commit to afb
connect with afb
    expect in tasks menu qviews - tasks--label:Tasks, mytodos--label:My Tasks, overduetasks--label:Overdue Tasks




daffodil_hsr_applane
    expect pl.applications - productivity
    expect pl.menus -  tasks, target, result

    add field to tasks - reporting_to : employee_fk, set : [name]
    update a field - task : sortable:true

    expect fields count of tasks -  7 and all 7 field expressoin - sort by field
    expect pl.fields - sortable : true

    insert into pl.currencies
    insert into employee  - Ritesh daffodil hsr applane
    insert into employee  - sachin daffodil hsr applane
    insert into tasks {task:"daffodil t1",employeeid:{$query:{name:"Ritesh daffodil hsr applane"}},effort:{10 Hrs},reporting_to:{sachin}}
    expect - employeeid, reporting_to

connect with afb_sb
    add a field to tasks - effort_done : duration
    update a field : task : filterable:true,sortable:false
    menu add to tasks - comments : index :50
    menu label change - goals - achievements
    menu label change - task - TODos

commit to afb
connect with afb
    expect menu count - 3
    TODos, achievements, comments
    expect field count in tasks - 10 - order by field {$collectoin:"pl.fields",$filter:{"collectionid.collection":"tasks"},$sort:{"field":1}}


synch daffodil
connect with daffodil
    expect menus count : 4   - TODos, target,  result - comments
    expect fields of tasks - 10 - expect and also expect fields
synch daffodil_hsr_applane
connect with daffodil_hsr_applane
    expect menus count : 4   - TODos, target,  result - comments
    expect fields of tasks  - 11 and expect them
        field - task - filterable:true, sortable:true (it get changed by daffodil_hsr_applane)

connect with daffodil_sb

   change field - employeeid in tasks, $set : {"set":[name,code]}
commit to daffodil
connect with daffodil
    expect set field it is two
    expect pl.refferedfks for setfields changes

    insert a task into tasks -
    {task:"daffodil t2",employeeid:{$query:{name:"Ritesh daffodil"}},effort:{10 Hrs},reporting_to:{sachin}}
    expect - employeeid :{_id:..,name:'',code:''}

    repoulate set fields on tasks
    expect t1  -employeeid - this code will be populated in that document


synch daffodil_hsr_applane
connect with daffodil_hsr_applane
    expect employeeid field of tasks - set:["name","code"]
    re populate setfield for tasks
    expect task assignto is re populated with name and code



connect with afb_sb
    tasks - add field  :status  :string
    add events
        onSave : pre:true, operation==insert- status:New - taskBL - onPreSave - document.set("status":"New")
    pl.functions - add -
commit to afb
synch daffodil
connect with daffodil
    new tasks
    expect : status:new
connect with daffodil_sb
    add event : if no body is assignto : assignto : rohit
    pl.functions - add function

commit to daffdoil
connect with daffoidl
    new tasks - (leave employeeid blank)
        staus : new --> from afb
        employeeid - Rohit

















connect with daffodil_sb
    add qview - daffodiltasks
    menus - tasks  -
        add qview - daffodiltasks
        update a qview label - overduetasks  -  daffodil overdue tasks
commit to daffodil
connect with daffodil
    expect - qviews in menu - tasks, mytodos, daffodil overdue tasks, daffodiltasks
    expect a qview - daffodiltasks

connect with afb_sb
    menu - tasks - update
            qviews  - insert -  {id:"tasks",label:futuretasks}
            qviews - label change - overdue tasks - pending tasks
                    tasks - label change - All tasks
            qview  -delete - mytodos
commit to afb
connect with afb
    expect menu - qview ---  All tasks,  pending tasks, futuretasks
connect with daffodil_sb
    update menu - qview - tasks - (alltasks changed by afb_sb) - label change - Daffodil all tasks

synch daffodil
connect with daffodil
 expect - qviews in menu - All tasks, daffodil overdue tasks, daffodiltasks, futuretasks
synch daffodil_sb
connect with daffodil_sb
    expect - qviews in menu - Daffodil all tasks, daffodil overdue tasks, daffodiltasks, futuretasks
commit to daffodil
connect with daffodil
    expect - qviews in menu - Daffodil all tasks, daffodil overdue tasks, daffodiltasks, futuretasks


connect with afb_sb
    new application - Account management
        menu insert - accounts
        accounts
            add field to collection - name, type, accountgroupid - setfield name
            add template - template:"", collectionid:{$query:{}}
        add collection  -accountgroups
            add fields - name
            add action - account groups -> type : invoke, label:"Synch accounts"
    new role - account_manager, account_operator
    employees
        add field to employees - gender - string
        add actions -
            label : synch employees, type:invoke
            label : port employees, type:invoke
    tasks
        add field to tasks - duedate, type:date
        add field project: string
    application - productivity
        new menu - issues
        issues  -collection
        add field name  : string
commit to afb
    expect application  - Account management, Productivity
    menus - Account management - accounts
    menus - Productivity - TODos, achievements, comments - issues
    expect field in issues---name
    expect fields in tasks---convertedvalue,convertedvalue,duedate,effort,effort_done,employeeid,project,task,time,time,unit,unit
    expect fields in employees--age,code,amount,gerder,name,salary,type
    expect fields in accounts----accountgroupid,name,type
    expect fields in accounts groups--name
    expect action in employees
    expect action in account groups
    expect roles





sync daffodil
    account management - application, menu--Accounts
    productivity - new menu - issues
    employees - new field---gender, new actions---portEmployees,syncEmployees
    tasks - new field expect

connect with daffodil_sb
    update application label - Account managements - Book management
        add new menu - taxes
    update productivity - application
        add menu - daffodilissues
    employees -
        add new field - join_date : date
 -   update account fields - add field - account_group_type
commit to daffodil
    expect
        application - label change - Book management
        menus - accounts, taxes
        application - productivity
            expect menus count : 5   - TODos, target,  result , comments,daffodil issues
        fields - acccounts--accountgroupid,name,type,account_group_type
        field  -tasks-------expect fields of tasks - 12 -
        field  -employees--age,code,amount,type,gender,salary,name,join_date
connect with daffodil_hsr_applane
    account management -
        insert menu - applaneaccounts
    expect - application label - book management
        expct menus - accounts, taxes, applaneaccounts
        expect tasks - it does not have field - duedate
        expect employees collection - joining_date

synch daffodil_hsr_applane
        expect -
        tasks - now it have duedate
connect with afb_sb
    application - chagne label - productivity - TODOS
        remove menu - comments
        add menu - followups
        menu label change - issues - Issue/Features
    tasks collections
            add field  -start_date
            update - task, label:"note"
            remove field - duedate
            add action - update tasks
    employees
            add action - send greeting
            action update - change label
            add field - anniversary date
    accounts
        add field - synch : boolean
        update field - name -label---> Account


    application - Account management - Account keeping
        add menu
        update menu - label   Accounts--->label changed--->Applane New Accounts


commit to afb
    expect - application - TODOS, Account keeping
    menus in todos---->Achievements,Follow Ups,Issues/Features,ToDos
    expect menus in account keeping--->Issues,Aplane New Accounts
    expect fields in tasks--->
    expect fields in employees
    expect actoins in tasks
    expedct actions in employees
    expect fields in accounts

auto sync

expect daffodil
expect daffodil_hsr_applane







New test cases
db                 sandbox_db           global_db       commit_db       auto_sync   is_sandbox      ensureDefaultCollection
afb                afb_sb                 -               -             false         false                  true
afb_sb             -                     afb             afb            true          true
daffodil           daffodil_sb           afb             -              true          false
daffodil_sb         -                   daffodil         daffodil       true          true

connect with afb_sb
    create applicaton - tasks management
    add menu - issues, features, roadmap,comments
    add field to  issues -
            issue : string, lable:Issue, mandatory:true,filterable:true
            desc : string, lable:Issue, mandatory:true,filterable:true
            due_date : string, lable:Issue, mandatory:true,filterable:true
    features,
             feature : string, lable:Issue, mandatory:true,filterable:true
             desc : string, lable:Issue, mandatory:true,filterable:true
             due_date : string, lable:Issue, mandatory:true,filterable:true
    roadmap,
             roadmap : string, lable:Issue, mandatory:true,filterable:true
             desc : string, lable:Issue, mandatory:true,filterable:true
             due_date : string, lable:Issue, mandatory:true,filterable:true
    comments
             comment : string, lable:Issue, mandatory:true,filterable:true
             date : string, lable:Issue, mandatory:true,filterable:true
    create applicaton - book management
        add menu - accounts : Accounts, account groups: Account groups, vouchers : Vouchers, banks:Banks

commit to afb
connect with afb
    expcect
        menus - issues : Issues, features : Features, roadmap :Roadmap,comments : Comments
    expect field to  issues -
         issue : string, lable:Issue, mandatory:true,filterable:true
         desc : string, lable:Desc, mandatory:true,filterable:true
         due_date : string, lable:Due date, mandatory:true,filterable:true
    features,
         feature : string, lable:Feature, mandatory:true,filterable:true
         desc : string, lable:Desc, mandatory:true,filterable:true
         due_date : string, lable:Due date, mandatory:true,filterable:true
    roadmap,
         roadmap : string, lable:Roadmap, mandatory:true,filterable:true
         desc : string, lable:Desc, mandatory:true,filterable:true
         due_date : string, lable:Due date, mandatory:true,filterable:true
    comments
         comment : string, lable:Comment, mandatory:true,filterable:true
         date : string, lable:Date, mandatory:true,filterable:true

connect with daffodil_sb
    expect all above

    tasks management
        add a menu - projects : Projects
        delete a menu - comments
        update a menu -   Features -> Daffodil features
    book management
             update book management - Book keeping
             add menu - invoices, receipts
             update two menu - Accounts - Entities, Account groups : Entity groups
             Remove - vouchers, Banks


    collection
        add a field to issues :
                owner : string, label:Owner
        update a field -> issue -> label:"Bug", fts:true, mandatory:unset
        remove a field - due_date

        features
            add a field  feature_owner : string, label:Feature Owner
            update desc - label:Description, unset  :mandatory,filterable, set -> groupable:true, searchable:false
        roadmap
            update -
            desc  --- label : Description
            due_date - Deliver date


commit to daffodil

 expect
    tasks management
        menus -     Daffodil features, Issues, Projects, Roadmap
    Book keeping (u)
        menus -  accounts : Entities, account groups: Entity groups, Invoices (new), Receipts(new)
    issues
         issue : string, lable:Bug(U), filterable:true, fts:true(U), mandatory:undefined(U)
         desc : string, lable:Desc, mandatory:true,filterable:true
         due_date  -removed from daffodil
         owner : string, label:Owner - Added
    features,
         desc : string, lable:Description(u), mandatory:true (unset),filterable:true(unset), groupable:true(u), searchable:false(u)
         due_date : string, lable:Due date, mandatory:true,filterable:true
         feature : string, lable:Feature, mandatory:true,filterable:true
         feature_owner : string, label:Feature Owner - added

    roadmap,
         desc : string, lable:Description (u), mandatory:true,filterable:true
         due_date : string, lable:Delivery date(u), mandatory:true,filterable:true
         roadmap : string, lable:Roadmap, mandatory:true,filterable:true


connect with daffodil_sb
        remove fields in roadmap - desc, due_date
commit to daffodil
    roadmap,
         roadmap : string, lable:Roadmap, mandatory:true,filterable:true



connect with afb_sb
    Task management - label : Productivity
    menus -
            issues : Issues, --> Removed
            features : Features, : label : All features, index :50, searchable:true
            roadmap :Roadmap, , label : Future tasks, index : 70
            comments : Comments  , update label : All comments,  index : 20
            release : Release     -new
            backlogs  : Back logs  -new
    Book management - label changed - Book house
               accounts : Accounts, - -> search:true, sortable:true
               account groups: Account groups, -> Removed
               vouchers : Vouchers, -> search:true, sortable:true
               banks:Banks          -> search:true, sortable:true
    Collection : issues
             issue : string, lable:All issues, mandatory:false,filterable:false,fts:false,groupable:true,recursion:true   --
                    1.mandatory:false, fts:false ,filterable:false,groupable:true, unset:label
                    2.lable:All issues, recursion:true

             desc : string, lable:Description, mandatory:undefined,filterable:undefined,sortable:true
                     update -  unset : mandatory, filterable, $set -> label:"Description", $set:sortable:true
             due_date : string, lable:Due date, mandatory:true,filterable:true - Removed
             issue_date  : Issue date : new field
             issue_by : Issue by - new field

        add action
                addIssue
                removeIssue
     collection : features
             feature : string, lable:Features, mandatory:false,group : false  ---
                                    1. set:label:Features, group:true
                                    2. unset : mandatory, filterable
                                    3. set : mandatory:false
                                    4. group : unset
                                    5: group : false
             desc : string, lable:Desc, mandatory:true,filterable:true  - Removed
             due_date : string, lable:Due date, mandatory:true,filterable:true - Removed


commit



synch to daffodils
        application = Productivity
            backlogs : Back logs  -new
            features : Daffodil features, , index :50, searchable:true
            projects : Projects,
            release : Release     -new
            roadmap : label : Future tasks, index : 70


            comments - Removed from daffodil
            issues : Issues, --> Removed due to afb

         applicatoin  :Book keepping
                menus -  accounts : Entities, search:true, sortable:true
                account groups: Entity groups, Removed due to afb
                Invoices (new),
                Receipts(new)


        issues
             issue : string, lable:Bug(U), filterable:false, fts:true(U), mandatory:undefined(U) ,groupable:true, recursion:true
             desc  :   lable:Description, mandatory:undefined,filterable:undefined,sortable:true
             owner : string, label:Owner - Added
             issue_date  : Issue date : new field
             issue_by : Issue by - new field
             due_date - removed from daffodil
        actions
             addIssue
             removeIssue

        features
                 desc : string, lable:Description(u), mandatory:true (unset),filterable:true(unset), groupable:true(u), searchable:false(u)  --REmoved
                 due_date : string, lable:Due date, mandatory:true,filterable:true -- --REmoved
                 feature : string, lable:Features, mandatory:false,filterable:undefined,group:false
                 feature_owner : string, label:Feature Owner - added


 synch to daffodils
        expect same set as above

connect to afb_sb
        featrues
             desc : string, lable:Desc, mandatory:true,filterable:true  - Added
                    update :  mandatory:false, filterable:false
                    udpate : unset - mandatory,label
                    update : unset : filterable
                    udpate : set : label : Description, filterable:false, group:true


                    Net -> string, lable:Description, mandatory:undefined,filterable:false, group:true
               due_date : string, lable:Due date, mandatory:true,filterable:true - added
 commit
synch daffodl
connect with daffodil

        featrues
                desc : string, lable:Description, mandatory:undefined,filterable:false, group:true
                due_date : string, lable:Due date, mandatory:true,filterable:true
                feature : string, lable:Features, mandatory:false,filterable:undefined,group:false
                feature_owner : string, label:Feature Owner - added


connect with afb_sb
    insert a new collection -> milestones
    add field to this collection -> name:string,label:Name, searchable:true, groupable:true , duedate:string, label:Due date, searchable:true, groupable:true
commit to afb
connect with daffodil
    expect pl.collection milestones
        expect -  fields
                name:string,label:Name, searchable:true, groupable:true ,
                duedate:string, label:Due date, searchable:true, groupable:true

connect with daffodil_sb
            update :name --> label:Milestone, searchable:false, groupable:unset
        duedate:string, label:Deliver date,  unset -> searchable:true, groupable:true
commit to daffodild
connect with daffodil
    expect pl.collection milestones
        expect -  fields
            name:string,label:Milestone, searchable:false, groupable:undefined,
            duedate:string, label:Deliver date, searchable:undefined, groupable:undefined


connect with afb_sb
         update :name --> label:New Milestone, searchable:unset, groupable:false
         duedate:string,   searchable:false, groupable:false
commit to afb
connect with afb
    expect fields
         name:string,label:New Milestone, searchable:undefined, groupable:false,
         duedate:string, label:Due date, searchable:false, groupable:false
connect with daffodilsw
        get max version in daffodilsw for collection:milestones
    synch with afb
    expect
         name:string,label:Milestone, searchable:false, groupable:undefined,
         duedate:string, label:Deliver date, searchable:undefined, groupable:undefined
        get max version in daffodilsw for collection:milestones - its value shoule be 1 greater than pre







 insert, update and delete in collection before sync

 connect with afb_sb
 add collection---tasks
 add field--->task

 commit to afb

 connect with daffodil
 update field--mandatory true


 connect with afb_sb
 add field-->date --label:Date
 commit to afb
 connect with afb_sb
 update field-->date --change label: Due Date
 commit to afb
 connect with afb_sb
 delete field date
 commit to afb

 connect with daffodil

 sync daffodil

 expect daffodil
 field task. --mandatory true




 insert,update and delete in array case
 connect with afb_sb
 add application
 add menu -->tasks--label Tasks
 commit afb_sb

 connect with daffodil
 change label of Tasks to Menu Tasks


 connect with afb_sb
 add qview in menu--overdue Task
 commit

 connect with afb_sb
 update qview label in menu--Afb overdue Task
 commit

 connect with afb_sb
 delete qview in menu--overdue Task
 commit

 connect with daffodil
 expect label---Menu Tasks
 qviews length---1
 qviews label Task


 ==================
 TEST CASE WITH TWO LEVEL ARRAY

 connect with afb_sb
     add role
     role name--Developer
     privileges-->collection tasks,
     operationsinfos-->
     type find
     type update
 commit

 connect with daffodil
 expect them

 connect wit afb_sb
    update privilege--->fieldsAvailability--include
 commit

 connect wth daffodil_sb
    update privilege--filterUI--json
 commit

 sync daffodil
    expect them with daffodil
    fileldsavailability--include
    filterUI--json
    update opeationInfos--primaryFields true in type find


 connect with afb_sb
    update operationInfo--add type delete
    update operationInfo----update type find--primaryFields-false
 commit

 connect with afb
 expect operationinfos--length 3

 sync daffodil

 connect with daffodil_sb
    expect operationInfo --length 2
    add new operationInfo--type delete

 expect operatitioninfo--length 3



 //field update test case, fee: duaraiton, now change it to currency and expect changes, in commit and synch db

 commit and rollback related issues

 applications
 insert
 application- update
 menu
 insert
 update
 remove


 collection
 insert
 add fields
 new field
 remove field
 new field  - //should cause error

 now connect with business and change a field name (same field that is updated in business_sb)
 error will come
 now roll back should occur
 application should not exists in afb
 and updated menus should be rollback



 now synch issue
 afb
 daffodil
 daffodil_hsr
 daffodil_hsr_applane

 darcl

 field has been override at each level
 error will be thrown by daffodil_hsr
 so after synch, it should reflect in daffodil and darcl, but should not reflect in daffodil_hsr and daffodil_hsr_applane

 synch part should have , 1+ field added, 1+  removed and 1+ updated, all should be rollback, last update should have problem
 also do maual syunch for daffodil_hsr - error will come


 //sandbox case
 start tx
 do some insertion - currency, and fk field, deletion, removal
 manual rollback tx
 now expect old stage

 //lock test cases
 db - start tx     - business_sb
 tasks add field

 db1 - business_sb
 start_tx
 tasks add field































 */