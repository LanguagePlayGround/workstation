var Form = React.createClass({
    displayName: 'Form',
    getInitialState: function () {
        return {
            groups: [
                {
                    'row-span': 4,
                    columns: [
                        {
                            'col-span': 2,
                            field:'Name'
                        },
                        {
                            'col-span': 2,
                            field:'Account'
                        },
                        {
                            'col-span': 2,
                            field:'Name'
                        },
                        {
                            'col-span': 2,
                            field:'Account'
                        }
                    ]
                },
                {
                    'row-span': 3,
                    columns: [
                        {
                            'col-span': 1,
                            field:'DOJ'
                        },
                        {
                            'col-span': 2,
                            field:'Shift'
                        }
                    ]
                }
            ],
            data:{
                Name:'Naveen Singh',
                Account:'9990199019',
                Shift:'Morning',
                DOJ:'02/02/2014'
            }
        };
    },
    render: function () {
        var that = this;
        return (
            React.createElement('div', {
            },React.createElement('div', null,
                this.state.groups.map(function (group, i) {
                    return React.createElement(Group, {
                        key: i,
                        group: group,
                        data:that.state.data
                    })
                })
            ))
            )
    }
});

var Group = React.createClass({
    render: function () {
        var that = this;
        return (
            React.createElement('div', {className:"group",'data-row-span':this.props.group['row-span']},
                this.props.group.columns.map(function (col, i) {
                    return React.createElement(GroupContent, {
                        key: i,
                        col: col,
                        data:that.props.data
                    })
                })
            )
            )
    }
});

var GroupContent = React.createClass({
    render:function(){
        return (React.createElement(Col, {col:this.props.col,'data-col-span':this.props.col['col-span'],data:this.props.data}))
    }
});
var Col = React.createClass({
    render: function () {
        return (<div className='col-wrapper' data-col-span={this.props.col['col-span']} >
        {React.createElement(ColContent, {field: this.props.col.field,data:this.props.data})}
        </div>
       )
    }
});

var ColContent = React.createClass({
    render: function () {
        return (
            <div  className='col'>
                <label>{this.props.field}</label>
                <input type="text" value={this.props.data[this.props.field]} />
            </div>
            )
    }
});

React.render(React.createElement(Form, {}), document.getElementById("myForm"));