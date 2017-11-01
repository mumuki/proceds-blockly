function initProcedsBlockly(customStatementType) {
  Blockly.Msg.PROCEDURES_DEFNORETURN_COMMENT = 'Describe el procedimiento...';
  Blockly.Msg.PROCEDURES_DEFNORETURN_PROCEDURE = "Hacer algo";
  Blockly.Msg.PROCEDURES_DEFNORETURN_TITLE = "Definir";
  Blockly.Msg.PROCEDURES_DEFNORETURN_NOPARAMS = "";
  Blockly.Msg.PROCEDURES_DEFRETURN_NOPARAMS = "";
  Blockly.Msg.PROCEDURES_DEFRETURN_COMMENT = 'Describe la función...';
  Blockly.Msg.PROCEDURES_DEFRETURN_PROCEDURE = "devolver algo";
  Blockly.Msg.PROCEDURES_DEFRETURN_TITLE = "Definir";
  Blockly.Msg.PROCEDURES_BEFORE_PARAMS = "con:";
  Blockly.Msg.PROCEDURES_DEFNORETURN_TOOLTIP = "Crea un procedimiento.";
  Blockly.Msg.PROCEDURES_DEFRETURN_TOOLTIP = "Crea una función.";
  Blockly.Msg.PROCEDURES_ADD_PARAMETER = "Agregar parámetro";
  Blockly.Msg.PROCEDURES_ADD_PARAMETER_PROMPT = "Ingresa el nombre del parámetro";
  Blockly.Msg.PROCEDURES_REMOVE_PARAMETER = "Quitar parámetro";

  // --------------------------------
  // [!] Adding defaultName parameter
  // --------------------------------

  var makeProcedureInit = function(withReturn, withStatements = true, withParametersMutator = false, defaultName, title, comment, tooltip, helpUrl) {
    return function() {
      var nameField = new Blockly.FieldTextInput(defaultName, // [!]
          Blockly.Procedures.rename);
      nameField.setSpellcheck(false);
      this.appendDummyInput()
          .appendField(title)
          .appendField(nameField, 'NAME')
          .appendField('', 'PARAMS');

      if (withReturn)
        this.appendValueInput('RETURN')
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(Blockly.Msg.PROCEDURES_DEFRETURN_RETURN);

      if (withParametersMutator)
        this.setMutator(new Blockly.Mutator(['procedures_mutatorarg']));

      if ((this.workspace.options.comments ||
           (this.workspace.options.parentWorkspace &&
            this.workspace.options.parentWorkspace.options.comments)) &&
          comment) {
        this.setCommentText(comment);
      }
      this.setCommentText(null);
      this.setColour(Blockly.Blocks.procedures.HUE);
      this.setTooltip(tooltip);
      this.setHelpUrl(helpUrl);
      this.arguments_ = [];
      this.setStatements_(withStatements);
      this.statementConnection_ = null;

      if (!withParametersMutator) this.updateParams_();
    };
  };

  // ---------------------------------------------------
  // [!] Using .unshift instead of .push for new options
  // ---------------------------------------------------

  var makeProcedureCustomMenu = function(withParametersOptions = true) {
    return function(options) {
      // Add options to create getters for each parameter.
      if (!this.isCollapsed()) {
        for (var i = this.arguments_.length - 1; i >= 0; i--) {
          var option = {enabled: true};
          var name = this.arguments_[i];
          option.text = Blockly.Msg.VARIABLES_SET_CREATE_GET.replace('%1', name);
          var xmlField = goog.dom.createDom('field', null, name);
          xmlField.setAttribute('name', 'VAR');
          var xmlBlock = goog.dom.createDom('block', null, xmlField);
          xmlBlock.setAttribute('type', 'variables_get');
          option.callback = Blockly.ContextMenu.callbackFactory(this, xmlBlock);
          options.unshift(option);
        }
      }

      // [!]
      if (withParametersOptions) {
        options.unshift({
          enabled: this.arguments_.length > 0,
          text: Blockly.Msg.PROCEDURES_REMOVE_PARAMETER,
          callback: function() {
            this.arguments_.pop();
            this.updateParams_();
          }.bind(this)
        });

        options.unshift({
          enabled: true,
          text: Blockly.Msg.PROCEDURES_ADD_PARAMETER,
          callback: function() {
            var name = "";
            while (name === "")
              name = prompt(Blockly.Msg.PROCEDURES_ADD_PARAMETER_PROMPT);
            if (name === null) return;

            this.arguments_.push(name);
            this.updateParams_();
          }.bind(this)
        });
      }

      // Add option to create caller.
      var option = {enabled: true};
      var name = this.getFieldValue('NAME');
      option.text = Blockly.Msg.PROCEDURES_CREATE_DO.replace('%1', name);
      var xmlMutation = goog.dom.createDom('mutation');
      xmlMutation.setAttribute('name', name);
      for (var i = 0; i < this.arguments_.length; i++) {
        var xmlArg = goog.dom.createDom('arg');
        xmlArg.setAttribute('name', this.arguments_[i]);
        xmlMutation.appendChild(xmlArg);
      }
      var xmlBlock = goog.dom.createDom('block', null, xmlMutation);
      xmlBlock.setAttribute('type', this.callType_);
      option.callback = Blockly.ContextMenu.callbackFactory(this, xmlBlock);
      options.unshift(option); // [!]

      options.pop(); // [!] Remove help
    };
  };

  // ----------------------------------------------------
  // [!] Setting custom statement type to procedure calls
  // ----------------------------------------------------

  var oldProceduresCallNoReturnInit = Blockly.Blocks['procedures_callnoreturn'].init;
  Blockly.Blocks['procedures_callnoreturn'].init = function() {
    oldProceduresCallNoReturnInit.call(this);
    if (customStatementType) {
      this.jsonInit({
        type: customStatementType,
        previousStatement: customStatementType,
        nextStatement: customStatementType
      });
    }
  };

  // -----------------------------------------
  // [!] Using PROCEDURES_BEFORE_PARAMS always
  // -----------------------------------------

  var makeUpdateParams = function() {
    return function() {
      var paramsString = this.arguments_.length > 0
        ? Blockly.Msg.PROCEDURES_BEFORE_PARAMS + ' ' + this.arguments_.join(", ")
        : Blockly.Msg.PROCEDURES_BEFORE_PARAMS; // [!]

      Blockly.Events.disable();
      try {
        this.setFieldValue(paramsString, 'PARAMS');
      } finally {
        Blockly.Events.enable();
      }
    };
  };

  Blockly.Blocks['procedures_defnoreturn'].init = makeProcedureInit(
    false, true, false,
    Blockly.Msg.PROCEDURES_DEFNORETURN_PROCEDURE,
    Blockly.Msg.PROCEDURES_DEFNORETURN_TITLE,
    Blockly.Msg.PROCEDURES_DEFNORETURN_COMMENT,
    Blockly.Msg.PROCEDURES_DEFNORETURN_TOOLTIP,
    Blockly.Msg.PROCEDURES_DEFNORETURN_HELPURL
  );
  Blockly.Blocks['procedures_defnoreturn'].customContextMenu = makeProcedureCustomMenu();
  Blockly.Blocks['procedures_defnoreturn'].updateParams_ = makeUpdateParams();

  Blockly.Blocks['procedures_defreturn'].init = makeProcedureInit(
    true, true, false,
    Blockly.Msg.PROCEDURES_DEFRETURN_PROCEDURE,
    Blockly.Msg.PROCEDURES_DEFRETURN_TITLE,
    Blockly.Msg.PROCEDURES_DEFRETURN_COMMENT,
    Blockly.Msg.PROCEDURES_DEFRETURN_TOOLTIP,
    Blockly.Msg.PROCEDURES_DEFRETURN_HELPURL
  );
  Blockly.Blocks['procedures_defreturn'].customContextMenu = makeProcedureCustomMenu();
  Blockly.Blocks['procedures_defreturn'].updateParams_ = makeUpdateParams();

  // -------------------------------------------------
  // [!] Adding a new type of procedure with no params
  // -------------------------------------------------

  Blockly.Blocks['procedures_defnoreturnnoparams'] = {
    init: makeProcedureInit(
      false, true, false,
      Blockly.Msg.PROCEDURES_DEFNORETURN_PROCEDURE,
      Blockly.Msg.PROCEDURES_DEFNORETURN_TITLE,
      Blockly.Msg.PROCEDURES_DEFNORETURN_COMMENT,
      Blockly.Msg.PROCEDURES_DEFNORETURN_TOOLTIP,
      Blockly.Msg.PROCEDURES_DEFNORETURN_HELPURL
    ),
    setStatements_: Blockly.Blocks['procedures_defnoreturn'].setStatements_,
    updateParams_: function() {
      Blockly.Events.disable();
      try {
        this.setFieldValue(Blockly.Msg.PROCEDURES_DEFNORETURN_NOPARAMS, 'PARAMS');
      } finally {
        Blockly.Events.enable();
      }
    },
    mutationToDom: Blockly.Blocks['procedures_defnoreturn'].mutationToDom,
    domToMutation: Blockly.Blocks['procedures_defnoreturn'].domToMutation,
    decompose: Blockly.Blocks['procedures_defnoreturn'].decompose,
    compose: Blockly.Blocks['procedures_defnoreturn'].compose,
    getProcedureDef: Blockly.Blocks['procedures_defnoreturn'].getProcedureDef,
    getVars: Blockly.Blocks['procedures_defnoreturn'].getVars,
    renameVar: Blockly.Blocks['procedures_defnoreturn'].renameVar,
    customContextMenu: makeProcedureCustomMenu(false),
    callType_: 'procedures_callnoreturnnoparams'
  };

  Blockly.Blocks['procedures_callnoreturnnoparams'] = {
    init: Blockly.Blocks['procedures_callnoreturn'].init,
    getProcedureCall: Blockly.Blocks['procedures_callnoreturn'].getProcedureCall,
    renameProcedure: Blockly.Blocks['procedures_callnoreturn'].renameProcedure,
    setProcedureParameters_: Blockly.Blocks['procedures_callnoreturn'].setProcedureParameters_,
    updateShape_: Blockly.Blocks['procedures_callnoreturn'].updateShape_,
    mutationToDom: Blockly.Blocks['procedures_callnoreturn'].mutationToDom,
    domToMutation: Blockly.Blocks['procedures_callnoreturn'].domToMutation,
    renameVar: Blockly.Blocks['procedures_callnoreturn'].renameVar,
    onchange: Blockly.Blocks['procedures_callnoreturn'].onchange,
    customContextMenu: Blockly.Blocks['procedures_callnoreturn'].customContextMenu,
    defType_: 'procedures_defnoreturnnoparams'
  };

  // ---------------------------------------------------------------------
  // [!] Adding a new type of function only with return value (and params)
  // ---------------------------------------------------------------------

  Blockly.Blocks['procedures_defreturnsimplewithparams'] = {
    init: makeProcedureInit(
      true, false, false,
      Blockly.Msg.PROCEDURES_DEFRETURN_PROCEDURE,
      Blockly.Msg.PROCEDURES_DEFRETURN_TITLE,
      Blockly.Msg.PROCEDURES_DEFRETURN_COMMENT,
      Blockly.Msg.PROCEDURES_DEFRETURN_TOOLTIP,
      Blockly.Msg.PROCEDURES_DEFRETURN_HELPURL
    ),
    setStatements_: Blockly.Blocks['procedures_defreturn'].setStatements_,
    updateParams_: Blockly.Blocks['procedures_defreturn'].updateParams_,
    mutationToDom: Blockly.Blocks['procedures_defreturn'].mutationToDom,
    domToMutation: Blockly.Blocks['procedures_defreturn'].domToMutation,
    decompose: Blockly.Blocks['procedures_defreturn'].decompose,
    compose: Blockly.Blocks['procedures_defreturn'].compose,
    getProcedureDef: Blockly.Blocks['procedures_defreturn'].getProcedureDef,
    getVars: Blockly.Blocks['procedures_defreturn'].getVars,
    renameVar: Blockly.Blocks['procedures_defreturn'].renameVar,
    customContextMenu: makeProcedureCustomMenu(true),
    callType_: 'procedures_callreturnsimplewithparams'
  };

  Blockly.Blocks['procedures_callreturnsimplewithparams'] = {
    init: Blockly.Blocks['procedures_callreturn'].init,
    getProcedureCall: Blockly.Blocks['procedures_callreturn'].getProcedureCall,
    renameProcedure: Blockly.Blocks['procedures_callreturn'].renameProcedure,
    setProcedureParameters_: Blockly.Blocks['procedures_callreturn'].setProcedureParameters_,
    updateShape_: Blockly.Blocks['procedures_callreturn'].updateShape_,
    mutationToDom: Blockly.Blocks['procedures_callreturn'].mutationToDom,
    domToMutation: Blockly.Blocks['procedures_callreturn'].domToMutation,
    renameVar: Blockly.Blocks['procedures_callreturn'].renameVar,
    onchange: Blockly.Blocks['procedures_callreturn'].onchange,
    customContextMenu: Blockly.Blocks['procedures_callreturn'].customContextMenu,
    defType_: 'procedures_defreturnsimplewithparams'
  };

  // --------------------------------------------------------
  // [!] Adding a new type of function only with return value
  // --------------------------------------------------------

  Blockly.Blocks['procedures_defreturnsimple'] = {
    init: makeProcedureInit(
      true, false, false,
      Blockly.Msg.PROCEDURES_DEFRETURN_PROCEDURE,
      Blockly.Msg.PROCEDURES_DEFRETURN_TITLE,
      Blockly.Msg.PROCEDURES_DEFRETURN_COMMENT,
      Blockly.Msg.PROCEDURES_DEFRETURN_TOOLTIP,
      Blockly.Msg.PROCEDURES_DEFRETURN_HELPURL
    ),
    setStatements_: Blockly.Blocks['procedures_defreturn'].setStatements_,
    updateParams_: function() {
      Blockly.Events.disable();
      try {
        this.setFieldValue(Blockly.Msg.PROCEDURES_DEFRETURN_NOPARAMS, 'PARAMS');
      } finally {
        Blockly.Events.enable();
      }
    },
    mutationToDom: Blockly.Blocks['procedures_defreturn'].mutationToDom,
    domToMutation: Blockly.Blocks['procedures_defreturn'].domToMutation,
    decompose: Blockly.Blocks['procedures_defreturn'].decompose,
    compose: Blockly.Blocks['procedures_defreturn'].compose,
    getProcedureDef: Blockly.Blocks['procedures_defreturn'].getProcedureDef,
    getVars: Blockly.Blocks['procedures_defreturn'].getVars,
    renameVar: Blockly.Blocks['procedures_defreturn'].renameVar,
    customContextMenu: makeProcedureCustomMenu(false),
    callType_: 'procedures_callreturnsimple'
  };

  Blockly.Blocks['procedures_callreturnsimple'] = {
    init: Blockly.Blocks['procedures_callreturn'].init,
    getProcedureCall: Blockly.Blocks['procedures_callreturn'].getProcedureCall,
    renameProcedure: Blockly.Blocks['procedures_callreturn'].renameProcedure,
    setProcedureParameters_: Blockly.Blocks['procedures_callreturn'].setProcedureParameters_,
    updateShape_: Blockly.Blocks['procedures_callreturn'].updateShape_,
    mutationToDom: Blockly.Blocks['procedures_callreturn'].mutationToDom,
    domToMutation: Blockly.Blocks['procedures_callreturn'].domToMutation,
    renameVar: Blockly.Blocks['procedures_callreturn'].renameVar,
    onchange: Blockly.Blocks['procedures_callreturn'].onchange,
    customContextMenu: Blockly.Blocks['procedures_callreturn'].customContextMenu,
    defType_: 'procedures_defreturnsimple'
  };

  // -------------------------------------------------------------------
  // [!] Adding two flyoutCategories: PROCEDURE_CALLS and FUNCTION_CALLS
  // -------------------------------------------------------------------

  Blockly.Procedures.procedureCallFlyoutCategory = function(workspace) {
    var xmlList = [];

    function populateProcedures(procedureList) { // [!]
      for (var i = 0; i < procedureList.length; i++) {
        var name = procedureList[i][0];
        var args = procedureList[i][1];
        const templateName = Blockly.Procedures.getDefinition(name, workspace).callType_; // [!]
        // <block type="procedures_callnoreturn" gap="16">
        //   <mutation name="do something">
        //     <arg name="x"></arg>
        //   </mutation>
        // </block>
        var block = goog.dom.createDom('block');
        block.setAttribute('type', templateName);
        block.setAttribute('gap', 16);
        var mutation = goog.dom.createDom('mutation');
        mutation.setAttribute('name', name);
        block.appendChild(mutation);
        for (var j = 0; j < args.length; j++) {
          var arg = goog.dom.createDom('arg');
          arg.setAttribute('name', args[j]);
          mutation.appendChild(arg);
        }
        xmlList.push(block);
      }
    }

    var tuple = Blockly.Procedures.allProcedures(workspace);
    populateProcedures(tuple[0]); // [!]
    return xmlList;
  };

  Blockly.Procedures.functionCallFlyoutCategory = function(workspace) {
    var xmlList = [];

    function populateProcedures(procedureList) { // [!]
      for (var i = 0; i < procedureList.length; i++) {
        var name = procedureList[i][0];
        var args = procedureList[i][1];
        const templateName = Blockly.Procedures.getDefinition(name, workspace).callType_; // [!]
        // <block type="procedures_callnoreturn" gap="16">
        //   <mutation name="do something">
        //     <arg name="x"></arg>
        //   </mutation>
        // </block>
        var block = goog.dom.createDom('block');
        block.setAttribute('type', templateName);
        block.setAttribute('gap', 16);
        var mutation = goog.dom.createDom('mutation');
        mutation.setAttribute('name', name);
        block.appendChild(mutation);
        for (var j = 0; j < args.length; j++) {
          var arg = goog.dom.createDom('arg');
          arg.setAttribute('name', args[j]);
          mutation.appendChild(arg);
        }
        xmlList.push(block);
      }
    }

    var tuple = Blockly.Procedures.allProcedures(workspace);
    populateProcedures(tuple[1]); // [!]
    return xmlList;
  };

  Blockly.Flyout.prototype.show = function(xmlList) {
    this.workspace_.setResizesEnabled(false);
    this.hide();
    this.clearOldBlocks_();

    // Handle dynamic categories, represented by a name instead of a list of XML.
    // Look up the correct category generation function and call that to get a
    // valid XML list.
    if (xmlList === "PROCEDURE_CALLS") { // [!]
      xmlList = Blockly.Procedures.procedureCallFlyoutCategory(this.workspace_.targetWorkspace);
    } else if (xmlList === "FUNCTION_CALLS") { // [!]
      xmlList = Blockly.Procedures.functionCallFlyoutCategory(this.workspace_.targetWorkspace);
    } else if (typeof xmlList == 'string') {
      var fnToApply = this.workspace_.targetWorkspace.getToolboxCategoryCallback(
          xmlList);
      goog.asserts.assert(goog.isFunction(fnToApply),
          'Couldn\'t find a callback function when opening a toolbox category.');
      xmlList = fnToApply(this.workspace_.targetWorkspace);
      goog.asserts.assert(goog.isArray(xmlList),
          'The result of a toolbox category callback must be an array.');
    }

    this.setVisible(true);
    // Create the blocks to be shown in this flyout.
    var contents = [];
    var gaps = [];
    this.permanentlyDisabled_.length = 0;
    for (var i = 0, xml; xml = xmlList[i]; i++) {
      if (xml.tagName) {
        var tagName = xml.tagName.toUpperCase();
        var default_gap = this.horizontalLayout_ ? this.GAP_X : this.GAP_Y;
        if (tagName == 'BLOCK') {
          var curBlock = Blockly.Xml.domToBlock(xml, this.workspace_);
          if (curBlock.disabled) {
            // Record blocks that were initially disabled.
            // Do not enable these blocks as a result of capacity filtering.
            this.permanentlyDisabled_.push(curBlock);
          }
          contents.push({type: 'block', block: curBlock});
          var gap = parseInt(xml.getAttribute('gap'), 10);
          gaps.push(isNaN(gap) ? default_gap : gap);
        } else if (xml.tagName.toUpperCase() == 'SEP') {
          // Change the gap between two blocks.
          // <sep gap="36"></sep>
          // The default gap is 24, can be set larger or smaller.
          // This overwrites the gap attribute on the previous block.
          // Note that a deprecated method is to add a gap to a block.
          // <block type="math_arithmetic" gap="8"></block>
          var newGap = parseInt(xml.getAttribute('gap'), 10);
          // Ignore gaps before the first block.
          if (!isNaN(newGap) && gaps.length > 0) {
            gaps[gaps.length - 1] = newGap;
          } else {
            gaps.push(default_gap);
          }
        } else if (tagName == 'BUTTON' || tagName == 'LABEL') {
          // Labels behave the same as buttons, but are styled differently.
          var isLabel = tagName == 'LABEL';
          var curButton = new Blockly.FlyoutButton(this.workspace_,
              this.targetWorkspace_, xml, isLabel);
          contents.push({type: 'button', button: curButton});
          gaps.push(default_gap);
        }
      }
    }

    this.layout_(contents, gaps);

    // IE 11 is an incompetent browser that fails to fire mouseout events.
    // When the mouse is over the background, deselect all blocks.
    var deselectAll = function() {
      var topBlocks = this.workspace_.getTopBlocks(false);
      for (var i = 0, block; block = topBlocks[i]; i++) {
        block.removeSelect();
      }
    };

    this.listeners_.push(Blockly.bindEventWithChecks_(this.svgBackground_,
        'mouseover', this, deselectAll));

    if (this.horizontalLayout_) {
      this.height_ = 0;
    } else {
      this.width_ = 0;
    }
    this.workspace_.setResizesEnabled(true);
    this.reflow();

    this.filterForCapacity_();

    // Correctly position the flyout's scrollbar when it opens.
    this.position();

    this.reflowWrapper_ = this.reflow.bind(this);
    this.workspace_.addChangeListener(this.reflowWrapper_);
  };

}
