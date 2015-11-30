/*
*
*
 pl.users
       username
       rajit



tasks
     task    owner:string   priority         status
     r1      rajit           low             new
     r2      rajit           high            new
     r3      rajit           high            in progress
     m1      manjeet         low             new
     m2      manjeet         high            in progress

collections
  collection : tasks
fields
    task
        label : Tasks
        visibility : true
    owner
        label : Owner
        visibility : true
    priority
         label : Priority
         visibility : true
    status
         label : Status
         visibility : true
qviews
    id : tasks
menus
        id: tasks
        collection : tasks
        label : Tasks
        defaultqviewmappingid
qviewmappings
         menuid(fk)   :tasks
         referredqviewid(fk) : tasks
         label : my tasks
         filter : {owner:{"$$CurrentUser":{"username":1}}}
         fieldAvailability : available
qfieldmappings
         qviewmappingid : my tasks
         fieldid : task

         qviewmappingid : my tasks
         fieldid : owner

qviewmappings
        menuid   :tasks
        referredqviewid(fk) : tasks
        label : all tasks
        filter : {owner:{"$$CurrentUser":{"username":1}}}
        fieldAvailability : override

qfieldmappings
        qviewmappingid : all tasks
        fieldid : priority
        visibility : false

         qviewmappingid : all tasks
         fieldid : status
         visibility : false



qviewmappings
         menuid   :tasks
         referredqviewid(fk) : tasks
         label : priority tasks
         sort : {priority:1}
        fieldAvailability : hidden

qfieldmappings
        qviewmappingid : priority tasks
        fieldid : status

        qviewmappingid : priority tasks
        fieldid : owner


















*
*
*
*
*
*
*
*
* */