import {SecureValuesPreprocessor} from '../../lib/secure-values-preprocessor';

describe('Log Internals', function () {
  /** @type {import('../../lib/secure-values-prepreocessor').SecureValuesPreprocessor} */
  let preprocessor;

  before(async function () {
    const chai = await import('chai');
    chai.should();
  });

  beforeEach(function () {
    preprocessor = new SecureValuesPreprocessor();
  });

  it('should preprocess a string and make replacements', function () {
    const issues = preprocessor.loadRules(['yolo']);
    issues.length.should.eql(0);
    preprocessor.rules.length.should.eql(1);
    const replacer = preprocessor.rules[0].replacer;
    preprocessor.preprocess(':yolo" yo Yolo yyolo').should.eql(`:${replacer}" yo Yolo yyolo`);
  });

  it('should preprocess a string and make replacements with multiple simple rules', function () {
    const issues = preprocessor.loadRules(['yolo', 'yo']);
    issues.length.should.eql(0);
    preprocessor.rules.length.should.eql(2);
    const replacer = preprocessor.rules[0].replacer;
    preprocessor
      .preprocess(':yolo" yo Yolo yyolo')
      .should.eql(`:${replacer}" ${replacer} Yolo yyolo`);
  });

  it('should preprocess a string and make replacements with multiple complex rules', function () {
    const replacer2 = '***';
    const issues = preprocessor.loadRules([
      {text: 'yolo', flags: 'i'},
      {pattern: '^:', replacer: replacer2},
    ]);
    issues.length.should.eql(0);
    preprocessor.rules.length.should.eql(2);
    const replacer = preprocessor.rules[0].replacer;
    preprocessor
      .preprocess(':yolo" yo Yolo yyolo')
      .should.eql(`${replacer2}${replacer}" yo ${replacer} yyolo`);
  });

  it(`should preprocess a string and apply a rule where 'pattern' has priority over 'text'`, function () {
    // NOTE: this is disallowed in the config schema, but is currently allowed when using an external JSON file.
    const replacer = '***';
    const issues = preprocessor.loadRules([{pattern: '^:', text: 'yo', replacer}]);
    issues.length.should.eql(0);
    preprocessor.rules.length.should.eql(1);
    preprocessor.preprocess(':yolo" yo Yolo yyolo').should.eql(`${replacer}yolo" yo Yolo yyolo`);
  });

  it('should preprocess a string and make replacements with multiple complex rules and issues', function () {
    const replacer2 = '***';
    const issues = preprocessor.loadRules([
      {text: 'yolo', flags: 'i'},
      {pattern: '^:(', replacer: replacer2},
    ]);
    issues.length.should.eql(1);
    preprocessor.rules.length.should.eql(1);
    const replacer = preprocessor.rules[0].replacer;
    preprocessor
      .preprocess(':yolo" yo Yolo yyolo')
      .should.eql(`:${replacer}" yo ${replacer} yyolo`);
  });

  it('should leave the string unchanged if all rules have issues', function () {
    const replacer2 = '***';
    const issues = preprocessor.loadRules([
      null,
      {flags: 'i'},
      {pattern: '^:(', replacer: replacer2},
    ]);
    issues.length.should.eql(3);
    preprocessor.rules.length.should.eql(0);
    preprocessor.preprocess(':yolo" yo Yolo yyolo').should.eql(':yolo" yo Yolo yyolo');
  });

  it('should add a new rule when it is a LogFilter', function () {
    const aRule = { pattern: '^:' };

    preprocessor.addRule(aRule);

    preprocessor.rules.length.should.eql(1);
    preprocessor.preprocess(':').should.eql('**SECURE**');
  });

  it('should add a new rule when it is a string', function () {
    const aRule = 'yolo';

    preprocessor.addRule(aRule);

    preprocessor.rules.length.should.eql(1);
    preprocessor.preprocess('yolo').should.eql('**SECURE**');
  });

  it('should add new rules only once', function () {
    const aRule = {pattern: '^:'};

    preprocessor.addRule(aRule);
    preprocessor.addRule({...aRule});

    preprocessor.rules.length.should.eql(1);
  });

  it('should add new rules', function () {
    const aRule = {pattern: '^:'};
    const anotherRule = ':';

    preprocessor.addRules([aRule, anotherRule]);

    preprocessor.rules.length.should.eql(2);
  });

});
