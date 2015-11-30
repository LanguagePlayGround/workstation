var Views = React.createClass({
    displayName: 'Views',
    setFormdata: function (row) {
        this.setState({viewOptions:{
            formdata: {column: [
                {
                    "key": "Name",
                    "label": "Name",
                    "type": "String"
                },
                {
                    "key": "Number",
                    "label": "Number",
                    "type": "String"
                },
                {
                    "key": "Position",
                    "label": "Position",
                    "type": "String"
                },
                {
                    "key": "Height",
                    "label": "Height",
                    "type": "String"
                },
                {
                    "key": "Weight",
                    "label": "Weight",
                    "type": "String"
                },
                {
                    "key": "Birthday",
                    "label": "Birthday",
                    "type": "String"
                },
                {
                    "key": "Years",
                    "label": "Years",
                    "type": "String"
                }
            ],
                items: {Number: row.Num, Name: row.Name, Position: row.Pos ,Height: row.Height, Weight: row.Weight, Birthday: row.Birthday, Years:row.Years}
            }
        }})
    },
    getInitialState: function () {
        return {
            viewOptions: {
                formdata: {column: [
                    {key: 'name', label: 'name', type: 'String'},
                    {key: 'position', label: 'Position', type: 'String'}
                ],
                    items: {name: 'Naveen', position: 'Software Associate'}
                }
            }
        };
    },
    render: function () {
        return(
            React.createElement('div', {
                className: 'viewWrapper'
            }, React.createElement(Table, {
                url: this.props.url,
                viewOptions: this.state.viewOptions,
                setFormdata: this.setFormdata
            }), React.createElement(Form, {
                formdata: this.state.viewOptions.formdata
            }))
            )
    }
});

var Form = React.createClass({
    displayName: 'Form',
    render: function () {
        var that = this;
        return(
            React.createElement('div', {className: 'panel', style: {border: '1px solid #333'}}, that.props.formdata.column.map(function (item, i) {
                return React.createElement(Formcontent, {
                    key: i,
                    value: that.props.formdata.items[item.key],
                    label: item.label,
                    column: that.props.formdata.column[i]
                })
            }))
            )

    }
});

var Formcontent = React.createClass({
    displayName: 'Formcontent',
    componentWillMount: function () {
    },
    componentDidMount: function () {
    },
    render: function () {
        return (
            React.createElement('div', {style:{padding:'10px', 'border-bottom':'1px solid #eee'}}, React.createElement(FormCell, {
                type: 'label',
                childClass: 'formField seperator',
                value: this.props.label,
                style: {'text-transform': 'capitalize'}
            }), React.createElement(FormCell, {
                type: 'label',
                childClass: 'formField',
                value: this.props.value
            }))
            )
    }
});

var FormCell = React.createClass({
    displayName: 'FormCell',
    render: function () {
        return (
            React.createElement(this.props.type, {
                className: this.props.childClass,
                id: this.props.key,
                style: this.props.style
            }, this.props.value)
            );
    }
});

var Table = React.createClass({
    displayName: 'Table',
    loadData: function () {
        $.ajax({
            url: this.props.url,
            data: {
                page: this.state.data.paginate.page,
                row_count: this.state.data.paginate.row_count,
                col_name: this.state.data.paginate.col_name,
                direction: this.state.data.paginate.direction
            },
            dataType: "json",
            success: function (data) {
                this.setState({
                    paginate: data.paginate
                });
                var timeStampStart = new Date().getTime();
                this.setState({
                    data: data
                });
                var timeStampEnd = new Date().getTime();
                console.log('time spend in binding--> '+(timeStampEnd - timeStampStart)+'ms');
            }.bind(this),
            error: function (xhr, status, err) {
                console.log(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    getInitialState: function () {
        return {
            data: {
                columns: [],
                items: [],
                paginate: {
                    page: 1,
                    pages: 1,
                    offset: 0,
                    row_count: 5,
                    total: 0,
                    col_name: "Name",
                    direction: "asc"
                }
            }
        };
    },
    componentDidMount: function () {
        this.loadData();
    },
    getFirst: function () {
        this.setState({
            paginate: $.extend(this.state.paginate, {
                page: 1
            })
        });
        this.loadData.call(this);
    },
    getPrev: function () {
        this.setState({
            paginate: $.extend(this.state.paginate, {
                page: this.state.paginate.page - 1
            })
        });
        this.loadData.call(this);
    },
    getNext: function () {
        this.setState({
            paginate: $.extend(this.state.paginate, {
                page: this.state.paginate.page + 1
            })
        });
        this.loadData.call(this);
    },
    getLast: function () {
        this.setState({
            paginate: $.extend(this.state.paginate, {
                page: this.state.paginate.pages
            })
        });
        this.loadData.call(this);
    },
    changeRowCount: function (e) {
        var el = e.target;
        this.setState({
            paginate: $.extend(this.state.paginate, {
                row_count: el.options[el.selectedIndex].value
            })
        });
        this.loadData.call(this);
    },
    sortData: function (e) {
        e.preventDefault();
        var el = e.target,
            col_name = el.getAttribute("data-column"),
            direction = el.getAttribute("data-direction");
        this.setState({
            paginate: $.extend(this.state.paginate, {
                col_name: col_name,
                direction: direction
            })
        });
        this.loadData.call(this);
    },
    render: function () {
        return (
            React.createElement("table", {
                    className: "r-table"
                },
                React.createElement(Head, {
                    data: this.state.data,
                    onSort: this.sortData
                }),
                React.createElement(Body, {
                    data: this.state.data,
                    setFormdata: this.props.setFormdata
                }),
                React.createElement(Foot, {
                    data: this.state.data,
                    onFirst: this.getFirst,
                    onPrev: this.getPrev,
                    onNext: this.getNext,
                    onLast: this.getLast,
                    onChange: this.changeRowCount,
                    onRefresh: this.loadData
                })));
    }
});

var Head = React.createClass({
    displayName: 'Head',
    render: function () {
        var that = this;
        return (
            React.createElement("thead", null,
                React.createElement("tr", null,
                    this.props.data.columns.map(function (column, i) {
                        return React.createElement(HeadCell, {
                            key: i,
                            column: column,
                            direction: that.props.data.paginate.direction,
                            onSort: that.props.onSort
                        })
                    }))));
    }
});

var Foot = React.createClass({
    displayName: 'Foot',
    render: function () {
        return (
            React.createElement("tfoot", null,
                React.createElement("tr", null,
                    React.createElement("td", {
                            colSpan: this.props.data.columns.length
                        },
                        React.createElement("div", {
                                className: "r-paginate"
                            },
                            React.createElement(Button, {
                                text: "<< First",
                                onClick: this.props.onFirst,
                                disabled: this.props.data.paginate.page === 1
                            }),
                            React.createElement(Button, {
                                text: "< Prev",
                                onClick: this.props.onPrev,
                                disabled: this.props.data.paginate.page === 1
                            }),
                            React.createElement(Button, {
                                text: "Next >",
                                onClick: this.props.onNext,
                                disabled: this.props.data.paginate.page === this.props.data.paginate.pages
                            }),
                            React.createElement(Button, {
                                text: "Last >>",
                                onClick: this.props.onLast,
                                disabled: this.props.data.paginate.page === this.props.data.paginate.pages
                            }),
                            React.createElement(Button, {
                                text: "Refresh",
                                onClick: this.props.onRefresh,
                                disabled: false
                            })),
                        React.createElement("div", {
                                className: "r-rowcount"
                            },
                            React.createElement("select", {
                                    onChange: this.props.onChange,
                                    name: "row_count"
                                },
                                React.createElement(Option, {
                                    value: "5"
                                }),
                                React.createElement(Option, {
                                    value: "100"
                                }),
                                React.createElement(Option, {
                                    value: "200"
                                }),
                                React.createElement(Option, {
                                    value: "500"
                                }),
                                React.createElement(Option, {
                                    value: "1000"
                                })), " rows per page"),
                        React.createElement("div", {
                                className: "r-stats"
                            },
                            React.createElement("span", {
                                className: ""
                            }, "Page ", this.props.data.paginate.page, " of ", this.props.data.paginate.pages))))));
    }
});

var Button = React.createClass({
    displayName: 'Button',
    render: function () {
        return (
            React.createElement("button", {
                type: "button",
                onClick: this.props.onClick,
                disabled: this.props.disabled
            }, this.props.text));
    }
});

var Option = React.createClass({
    displayName: 'Option',
    render: function () {
        return (
            React.createElement("option", {
                value: this.props.value
            }, this.props.value));
    }
});

var Body = React.createClass({
    displayName: 'Body',
    render: function () {
        var that = this;
        return (
            React.createElement("tbody", null,
                this.props.data.items.map(function (item, i) {
                    return React.createElement(Row, {
                        key: i,
                        item: item,
                        columns: that.props.data.columns,
                        setFormdata: that.props.setFormdata
                    })
                })));
    }
});

var Row = React.createClass({
    displayName: 'Row',
    handleRowClick:function(){
        this.props.setFormdata.call(this, this.props.item);
    },
//    getInitialState:function(){
//        return {
//            callFormData:this.props.setFormdata
//        }
//    },
    componentDidMount: function () {
//        this.handleRowClick =  this.props.setFormdata;
    },
    render: function () {
        var that = this;
        return (
            React.createElement("tr", {onClick:this.handleRowClick},
                this.props.columns.map(function (column, i) {
                    return React.createElement(Cell, {
                        key: i,
                        column: column,
                        value: that.props.item[column.key]
                    })
                })));
    }
});

var HeadCell = React.createClass({
    displayName: 'HeadCell',
    render: function () {
        return (
            React.createElement("th", null, React.createElement("a", {
                href: "#",
                'data-column': this.props.column.key,
                'data-direction': this.props.direction === "desc" ? "asc" : "desc",
                role: "button",
                tabIndex: "0",
                onClick: this.props.onSort
            }, this.props.column.label)));
    }
});

var Cell = React.createClass({
    displayName: 'Cell',
    render: function () {
        return (
            React.createElement("td", null, React.createElement(CellData, {
                column: this.props.column,
                value: this.props.value,
                setFormdata: this.props.setFormdata})));
    }
});

var CellData = React.createClass({
    displayName: 'CellData',
    render: function () {
        var that = this;
        return (
            React.createElement('div', null, Draw(this.props.column, this.props.value, this.props.setFormdata))
            );
    }
});

var Draw = function (column, value, onClick) {
    switch (column.type) {
        case 'Link':
            return React.createElement('a', {
                href: "#",
                tabIndex: "0",
                onClick: onClick
            }, value);
            break;
        case 'Number':
            return value;
            break;
        case 'String':
            return value;
            break;
        case 'Image':
            return React.createElement('img', {
                src: value
            }, null);
            break;
    }
}


React.render(React.createElement(Views, {url: "http://127.0.0.1:5500/rest/getdata"}), document.getElementById("grid"));