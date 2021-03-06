"use strict";

const test = require("ava");
const proxyquire = require("proxyquire");
const sinon = require("sinon");
let sandbox = null;
let db = null;
let id = 1;
let uuid = "yyy-yyy-yyy";

const agentFixtures = require("./fixtures/agent");

let config = {
  logging: function() {}
};

let MetricStub = {
  belongsTo: sinon.spy()
};

let single = Object.assign({}, agentFixtures.single);

let connectedArgs = {
  where: {
    connected: true
  }
};

let usernameArgs = {
  where: {
    username: "franndy",
    connected: true
  }
};

let uuidArgs = {
  where: {
    uuid
  }
};

let newAgent = {
  uuid: "123-123-123",
  name: "Anuel",
  username: "test",
  hostname: "nasa",
  pid: 0,
  connected: false
};
let AgentStub = null;

test.beforeEach(async () => {
  sandbox = sinon.createSandbox();
  AgentStub = {
    hasMany: sinon.spy()
  };

  // Model create Stub
  AgentStub.create = sandbox.stub();
  AgentStub.create.withArgs(newAgent).returns(
    Promise.resolve({
      toJSON() {
        return newAgent;
      }
    })
  );

  // Model findOne Stub
  AgentStub.findOne = sandbox.stub();
  AgentStub.findOne
    .withArgs(uuidArgs)
    .returns(Promise.resolve(agentFixtures.findByUuid(uuid)));

  // Model findAll Stub
  AgentStub.findAll = sandbox.stub();
  AgentStub.findAll.withArgs().returns(Promise.resolve(agentFixtures.all));
  AgentStub.findAll
    .withArgs(connectedArgs)
    .returns(Promise.resolve(agentFixtures.connected));
  AgentStub.findAll
    .withArgs(usernameArgs)
    .returns(Promise.resolve(agentFixtures.platzi));

  // Model Update Stub

  AgentStub.update = sandbox.stub();
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single));

  // Model findById Stub
  AgentStub.findById = sandbox.stub();
  AgentStub.findById
    .withArgs(id)
    .returns(Promise.resolve(agentFixtures.findById(id)));

  const setupDB = proxyquire("../", {
    "./models/agent": () => AgentStub,
    "./models/metric": () => MetricStub
  });
  db = await setupDB(config);
});

test.afterEach(() => {
  sinon.restore();
});

test("Agent", t => {
  t.truthy(db.Agent, "Agent service should exist");
});

test.serial("Setup", t => {
  t.true(AgentStub.hasMany.called, "AgentMode.hasMany was executed");
  t.true(MetricStub.belongsTo.called, "MetricStub.belongsTo was executed");
});

test.serial("Agent#findById", async t => {
  let agent = await db.Agent.findById(id);

  t.true(AgentStub.findById.called, "FindbyId should be called");
  t.true(AgentStub.findById.calledOnce, "FindByid should be called once");
  t.true(
    AgentStub.findById.calledWith(id),
    "FindById should be called with the specified id"
  );

  t.deepEqual(agent, agentFixtures.findById(id), "Should be the same.");
});

test.serial("Agent#createOrUpdate -existing obj", async t => {
  let agent = await db.Agent.createOrUpdate(single);

  t.true(AgentStub.findOne.called, "findOne should be called");
  t.true(AgentStub.findOne.calledTwice, "findOne should be called twice");
  t.true(AgentStub.findOne.calledWith(uuidArgs), "findOne should be called");

  t.true(AgentStub.update.called, "update should be called");
  t.true(AgentStub.update.calledOnce, "update should be called once");
  t.true(
    AgentStub.update.calledWith(single, uuidArgs),
    "Update called with specified params"
  );

  t.deepEqual(agent, single, "Agent should be the same");
});

test.serial("Agent#CreateOrUpdate -new", async t => {
  let agent = await db.Agent.createOrUpdate(newAgent);

  t.true(AgentStub.findOne.called, "findOne should be called");
  t.true(AgentStub.findOne.calledOnce, "FindOne should be called once");
  t.true(
    AgentStub.findOne.calledWith({ where: { uuid: agent.uuid } }),
    "Find one should be called with uuid args"
  );
});
