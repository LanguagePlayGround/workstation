var Form = React.createClass({
    displayName: 'Form',
    getInitialState: function () {
        return {
            groups: [
                {
                    cells: [
                        {
                            'cell-span': 67,
                            field:'Name',
                            value:'Naveen Singh'
                        },
                        {
                            'cell-span': 33,
                            field:'Account',
                            value:'9991000199'
                        }
                    ]
                },
                {
                    cells: [
                        {
                            'cell-span': 75,
                            field:'DOJ',
                            value:'02/02/2014'
                        },
                        {
                            'cell-span': 25,
                            field:'Shift',
                            value:'Alternate Weekend off'
                        }
                    ]
                }
            ]
        };
    },
    render: function () {
        return (
            React.createElement(Layout, {
                className: 'viewWrapper',
                groups: this.state.groups
            })
            )
    }
});
var Layout = React.createClass({
    displayName: 'Layout',
    render: function () {
        var that = this;
        return (
            React.createElement('div', null,
                this.props.groups.map(function (group, i) {
                    return React.createElement(Group, {
                        key: i,
                        group: group
                    })
                })
            )
        )
    }
});

var Group = React.createClass({
    render: function () {
        return (
            React.createElement('div', {
                    className:"group"
                },
                this.props.group.cells.map(function (cell, i) {
                    return React.createElement(GroupContent, {
                        key: i,
                        cell: cell
                    })
                })
            )
            )
    }
});

var GroupContent = React.createClass({
    displayName:'GroupContent',
    getInitialState:function(){
        return {
            data:this.props.cell
        }
    },
    render:function(){
        return (
             React.createElement(Cell, {
                className: 'cell-wrapper',
                 cell:this.props.cell,
                 'data-cell-span':this.props.cell['cell-span']
            })
            )
    }
});
var Cell = React.createClass({
    render: function () {
        return (<div className='cell-wrapper' data-cell-span={this.props.cell['cell-span']} >
            { React.createElement(CellContent, {
                field: this.props.cell.field,
                value:this.props.cell.value
                })}
                </div>
            )
    }
});

var CellContent = React.createClass({
    render: function () {
        return (
            <div  className='cell'>
                <label>{this.props.field}</label>
                <input type="text" value={this.props.value} />
            </div>
            )
    }
});
React.render(React.createElement(Form), document.getElementById("grid"));