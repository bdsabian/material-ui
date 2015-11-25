'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var React = require('react');
var ReactDOM = require('react-dom');
var WindowListenable = require('./mixins/window-listenable');
var CssEvent = require('./utils/css-event');
var KeyCode = require('./utils/key-code');
var Transitions = require('./styles/transitions');
var StylePropable = require('./mixins/style-propable');
var FlatButton = require('./flat-button');
var Overlay = require('./overlay');
var RenderToLayer = require('./render-to-layer');
var Paper = require('./paper');
var DefaultRawTheme = require('./styles/raw-themes/light-raw-theme');
var ThemeManager = require('./styles/theme-manager');
var warning = require('warning');

var ReactTransitionGroup = require('react-addons-transition-group');

var TransitionItem = React.createClass({
  displayName: 'TransitionItem',

  mixins: [StylePropable],

  contextTypes: {
    muiTheme: React.PropTypes.object
  },

  //for passing default theme context to children
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getChildContext: function getChildContext() {
    return {
      muiTheme: this.state.muiTheme
    };
  },

  getInitialState: function getInitialState() {
    return {
      style: {},
      muiTheme: this.context.muiTheme ? this.context.muiTheme : ThemeManager.getMuiTheme(DefaultRawTheme)
    };
  },

  //to update theme inside state whenever a new theme is passed down
  //from the parent / owner using context
  componentWillReceiveProps: function componentWillReceiveProps(nextProps, nextContext) {
    var newMuiTheme = nextContext.muiTheme ? nextContext.muiTheme : this.state.muiTheme;
    this.setState({ muiTheme: newMuiTheme });
  },

  componentWillEnter: function componentWillEnter(callback) {
    this.componentWillAppear(callback);
  },

  componentWillAppear: function componentWillAppear(callback) {
    var spacing = this.state.muiTheme.rawTheme.spacing;

    this.setState({
      style: {
        opacity: 1,
        transform: 'translate3d(0, ' + spacing.desktopKeylineIncrement + 'px, 0)'
      }
    });

    setTimeout(callback, 450); // matches transition duration
  },

  componentWillLeave: function componentWillLeave(callback) {
    var _this = this;

    this.setState({
      style: {
        opacity: 0,
        transform: 'translate3d(0, 0, 0)'
      }
    });

    setTimeout(function () {
      if (_this.isMounted()) callback();
    }, 450); // matches transition duration
  },

  render: function render() {
    var _props = this.props;
    var style = _props.style;

    var other = _objectWithoutProperties(_props, ['style']);

    return React.createElement(
      'div',
      _extends({}, other, { style: this.prepareStyles(this.state.style, style) }),
      this.props.children
    );
  }
});

var DialogInline = React.createClass({
  displayName: 'DialogInline',

  mixins: [WindowListenable, StylePropable],

  contextTypes: {
    muiTheme: React.PropTypes.object
  },

  //for passing default theme context to children
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getChildContext: function getChildContext() {
    return {
      muiTheme: this.state.muiTheme
    };
  },

  propTypes: {
    actions: React.PropTypes.array,
    autoDetectWindowHeight: React.PropTypes.bool,
    autoScrollBodyContent: React.PropTypes.bool,
    bodyStyle: React.PropTypes.object,
    contentClassName: React.PropTypes.string,
    contentStyle: React.PropTypes.object,
    open: React.PropTypes.bool.isRequired,
    repositionOnUpdate: React.PropTypes.bool,
    style: React.PropTypes.object,
    title: React.PropTypes.node
  },

  windowListeners: {
    keyup: '_handleWindowKeyUp',
    resize: '_handleResize'
  },

  getInitialState: function getInitialState() {
    return {
      muiTheme: this.context.muiTheme ? this.context.muiTheme : ThemeManager.getMuiTheme(DefaultRawTheme)
    };
  },

  getDefaultProps: function getDefaultProps() {
    return {
      autoDetectWindowHeight: false,
      autoScrollBodyContent: false,
      actions: [],
      repositionOnUpdate: true,
      open: null
    };
  },

  componentDidMount: function componentDidMount() {
    this._positionDialog();
  },

  componentDidUpdate: function componentDidUpdate() {
    this._positionDialog();
  },

  getStyles: function getStyles() {
    var spacing = this.state.muiTheme.rawTheme.spacing;

    var main = {
      position: 'fixed',
      boxSizing: 'border-box',
      WebkitTapHighlightColor: 'rgba(0,0,0,0)',
      zIndex: 10,
      top: 0,
      left: -10000,
      width: '100%',
      height: '100%',
      transition: Transitions.easeOut('0ms', 'left', '450ms')
    };

    var content = {
      boxSizing: 'border-box',
      WebkitTapHighlightColor: 'rgba(0,0,0,0)',
      transition: Transitions.easeOut(),
      position: 'relative',
      width: '75%',
      maxWidth: spacing.desktopKeylineIncrement * 12,
      margin: '0 auto',
      zIndex: 10
    };

    var body = {
      padding: spacing.desktopGutter,
      overflowY: this.props.autoScrollBodyContent ? 'auto' : 'hidden',
      overflowX: 'hidden'
    };

    var gutter = spacing.desktopGutter + 'px ';
    var title = {
      margin: 0,
      padding: gutter + gutter + '0 ' + gutter,
      color: this.state.muiTheme.rawTheme.palette.textColor,
      fontSize: 24,
      lineHeight: '32px',
      fontWeight: '400'
    };

    if (this.props.open) {
      main = this.mergeStyles(main, {
        left: 0,
        transition: Transitions.easeOut('0ms', 'left', '0ms')
      });
    }

    return {
      main: this.mergeStyles(main, this.props.style),
      content: this.mergeStyles(content, this.props.contentStyle),
      paper: {
        background: this.state.muiTheme.rawTheme.palette.canvasColor
      },
      body: this.mergeStyles(body, this.props.bodyStyle),
      title: this.mergeStyles(title, this.props.titleStyle)
    };
  },

  render: function render() {
    var styles = this.getStyles();
    var actions = this._getActionsContainer(this.props.actions);
    var title = undefined;
    if (this.props.title) {
      // If the title is a string, wrap in an h3 tag.
      // If not, just use it as a node.
      title = Object.prototype.toString.call(this.props.title) === '[object String]' ? React.createElement(
        'h3',
        { style: this.prepareStyles(styles.title) },
        this.props.title
      ) : this.props.title;
    }

    return React.createElement(
      'div',
      { ref: 'container', style: this.prepareStyles(styles.main) },
      React.createElement(
        ReactTransitionGroup,
        { component: 'div', ref: 'dialogWindow',
          transitionAppear: true, transitionAppearTimeout: 450,
          transitionEnter: true, transitionEnterTimeout: 450 },
        this.props.open && React.createElement(
          TransitionItem,
          {
            className: this.props.contentClassName,
            style: styles.content },
          React.createElement(
            Paper,
            {
              style: styles.paper,
              zDepth: 4 },
            title,
            React.createElement(
              'div',
              { ref: 'dialogContent', style: this.prepareStyles(styles.body) },
              this.props.children
            ),
            actions
          )
        )
      ),
      React.createElement(Overlay, {
        show: this.props.open,
        onTouchTap: this._handleOverlayTouchTap })
    );
  },

  _getAction: function _getAction(actionJSON, key) {
    var _this2 = this;

    var props = {
      key: key,
      secondary: true,
      onClick: actionJSON.onClick,
      onTouchTap: function onTouchTap() {
        if (actionJSON.onTouchTap) {
          actionJSON.onTouchTap.call(undefined);
        }
        if (!(actionJSON.onClick || actionJSON.onTouchTap)) {
          _this2._requestClose(true);
        }
      },
      label: actionJSON.text,
      style: {
        marginRight: 8
      }
    };

    if (actionJSON.ref) {
      props.ref = actionJSON.ref;
      props.keyboardFocused = actionJSON.ref === this.props.actionFocus;
    }
    if (actionJSON.id) {
      props.id = actionJSON.id;
    }

    return React.createElement(FlatButton, props);
  },

  _getActionsContainer: function _getActionsContainer(actions) {
    var actionContainer = undefined;
    var actionObjects = [];
    var actionStyle = {
      boxSizing: 'border-box',
      WebkitTapHighlightColor: 'rgba(0,0,0,0)',
      padding: 8,
      marginBottom: 8,
      width: '100%',
      textAlign: 'right'
    };

    if (actions.length) {
      for (var i = 0; i < actions.length; i++) {
        var currentAction = actions[i];

        //if the current action isn't a react object, create one
        if (!React.isValidElement(currentAction)) {
          currentAction = this._getAction(currentAction, i);
        }

        actionObjects.push(currentAction);
      }

      actionContainer = React.createElement(
        'div',
        { style: this.prepareStyles(actionStyle) },
        actionObjects
      );
    }

    return actionContainer;
  },

  _positionDialog: function _positionDialog() {
    if (!this.props.open) {
      return;
    }

    var clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    var container = ReactDOM.findDOMNode(this);
    var dialogWindow = ReactDOM.findDOMNode(this.refs.dialogWindow);
    var dialogContent = ReactDOM.findDOMNode(this.refs.dialogContent);
    var minPaddingTop = 16;

    //Reset the height in case the window was resized.
    dialogWindow.style.height = '';
    dialogContent.style.height = '';

    var dialogWindowHeight = dialogWindow.offsetHeight;
    var paddingTop = (clientHeight - dialogWindowHeight) / 2 - 64;
    if (paddingTop < minPaddingTop) paddingTop = minPaddingTop;

    //Vertically center the dialog window, but make sure it doesn't
    //transition to that position.
    if (this.props.repositionOnUpdate || !container.style.paddingTop) {
      container.style.paddingTop = paddingTop + 'px';
    }

    // Force a height if the dialog is taller than clientHeight
    if (this.props.autoDetectWindowHeight || this.props.autoScrollBodyContent) {
      var styles = this.getStyles();
      var maxDialogContentHeight = clientHeight - 2 * (styles.body.padding + 64);

      if (this.props.title) maxDialogContentHeight -= dialogContent.previousSibling.offsetHeight;
      if (this.props.actions.length) maxDialogContentHeight -= dialogContent.nextSibling.offsetHeight;

      dialogContent.style.maxHeight = maxDialogContentHeight + 'px';
    }
  },

  _requestClose: function _requestClose(buttonClicked) {

    if (!buttonClicked && this.props.modal) {
      return;
    }

    if (this.props.onRequestClose) {
      this.props.onRequestClose(!!buttonClicked);
    }
  },

  _handleOverlayTouchTap: function _handleOverlayTouchTap() {
    this._requestClose(false);
  },

  _handleWindowKeyUp: function _handleWindowKeyUp(event) {
    if (event.keyCode === KeyCode.ESC) {
      this._requestClose(false);
    }
  },

  _handleResize: function _handleResize() {
    if (this.props.open) {
      this._positionDialog();
    }
  }

});

var wrapperStyle = { position: 'fixed', top: 0, left: 0, zIndex: 20 };
var Dialog = React.createClass({
  displayName: 'Dialog',

  propTypes: {
    actionFocus: React.PropTypes.string,
    actions: React.PropTypes.array,
    autoDetectWindowHeight: React.PropTypes.bool,
    autoScrollBodyContent: React.PropTypes.bool,
    bodyStyle: React.PropTypes.object,
    contentClassName: React.PropTypes.string,
    contentStyle: React.PropTypes.object,
    defaultOpen: React.PropTypes.bool,
    modal: React.PropTypes.bool,
    onDismiss: React.PropTypes.func,
    onRequestClose: React.PropTypes.func,
    onShow: React.PropTypes.func,
    open: React.PropTypes.bool,
    openImmediately: React.PropTypes.bool,
    repositionOnUpdate: React.PropTypes.bool,
    style: React.PropTypes.object,
    title: React.PropTypes.node,
    titleStyle: React.PropTypes.object
  },

  getInitialState: function getInitialState() {
    if (process.env.NODE_ENV !== 'production') {
      this._testDeprecations();
    }

    var open = this.props.open;

    if (open === null) {
      open = this.props.openImmediately || this.props.defaultOpen;
    }

    return {
      open: open,
      muiTheme: this.context.muiTheme ? this.context.muiTheme : ThemeManager.getMuiTheme(DefaultRawTheme)
    };
  },

  getDefaultProps: function getDefaultProps() {
    return {
      open: null,
      defaultOpen: false,
      modal: false
    };
  },

  //to update theme inside state whenever a new theme is passed down
  //from the parent / owner using context
  componentWillReceiveProps: function componentWillReceiveProps(nextProps, nextContext) {
    var newMuiTheme = nextContext.muiTheme ? nextContext.muiTheme : this.state.muiTheme;
    this.setState({ muiTheme: newMuiTheme });

    if (process.env.NODE_ENV !== 'production') {
      this._testDeprecations();
    }
    if (nextProps.open !== this.props.open) {
      if (nextProps.open && !this.state.open) {
        this._show();
      } else if (!nextProps.open && this.state.open) {
        this._dismiss();
      }
    }
  },

  render: function render() {
    return React.createElement(RenderToLayer, { render: this.renderLayer, open: this.state.open });
  },

  renderLayer: function renderLayer() {
    return React.createElement(
      'div',
      { style: wrapperStyle },
      React.createElement(DialogInline, _extends({}, this.props, { onRequestClose: this.props.onRequestClose, open: this.state.open }))
    );
  },

  _testDeprecations: function _testDeprecations() {
    process.env.NODE_ENV !== 'production' ? warning(!this.props.hasOwnProperty('openImmediately'), 'openImmediately has been deprecated in favor of defaultOpen') : undefined;

    process.env.NODE_ENV !== 'production' ? warning(!(typeof this.props.onShow === 'function'), 'onShow will be removed in favor of explicitly setting open') : undefined;

    process.env.NODE_ENV !== 'production' ? warning(!(typeof this.props.onDismiss === 'function'), 'onDismiss will be removed in favor of explicitly setting open and can be replaced by onRequestClose') : undefined;
  },

  show: function show() {
    process.env.NODE_ENV !== 'production' ? warning(false, 'show has been deprecated in favor of explicitly setting the open property.') : undefined;

    this._show();
  },

  _onShow: function _onShow() {
    if (this.props.onShow) {
      this.props.onShow();
    }
  },

  _show: function _show() {
    this.setState({
      open: true
    }, this._onShow);
  },

  dismiss: function dismiss() {
    process.env.NODE_ENV !== 'production' ? warning(false, 'dismiss has been deprecated in favor of explicitly setting the open property.') : undefined;

    this._dismiss();
  },

  _onDismiss: function _onDismiss() {
    if (this.props.onDismiss) {
      this.props.onDismiss();
    }
  },

  _dismiss: function _dismiss() {
    this.setState({
      open: false
    }, this._onDismiss);
  },

  layerWillUnmount: function layerWillUnmount() {
    if (this.props.onDismiss) this.props.onDismiss();
  },

  isOpen: function isOpen() {
    return this.state.openImmediately;
  }

});

module.exports = Dialog;