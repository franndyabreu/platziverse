"use strict";

const test = require("ava");
const proxyquire = require("proxyquire");
const sinon = require("sinon");
const metricFixtures = require("./fixtures/metric");
const agentFixtures = require("./fixtures/agent");

const type = "cpu";
let agentUUID = "yyy-yyy-yyy";

const responseUuid = metricFixtures.findByAgentUuid(agentUUID);
const typeAgentResponse = metricFixtures.findByTypeAgentUuid(type, agentUUID);
let sandbox = null;
let db = null;

let AgentStub = {
  hasMany: sinon.spy()
};

const findByAgentUuidArgs = {
  attributes: ["type"],
  group: ["type"],
  include: [
    {
      attributes: [],
      model: AgentStub,
      where: {
        uuid: agentUUID
      }
    }
  ],
  raw: true
};

const typeAgentUuidArgs = {
  attributes: ["id", "type", "value", "createdAt"],
  where: {
    type
  },
  limit: 20,
  order: [["createdAt", "DESC"]],
  include: [
    {
      attributes: [],
      model: AgentStub,
      where: {
        uuid: agentUUID
      }
    }
  ],
  raw: true
};

let config = {
  logging: function() {}
};

let MetricStub = null;

let uuidArgs = {
  where: { uuid: agentUUID }
};

const newMetric = {
  id: 1,
  type: "memory",
  value: "705",
  createdAt: new Date(),
  updatedAt: new Date()
};

test.beforeEach(async () => {
  sandbox = sinon.createSandbox();
  MetricStub = {
    belongsTo: sandbox.spy()
  };

  // AgentStub = {
  //   hasMany: sandbox.spy()
  // };

  //Model findOne stub Agent

  AgentStub.findOne = sandbox.stub();
  AgentStub.findOne
    .withArgs({ where: { uuid: agentUUID } })
    .returns(Promise.resolve(agentFixtures.findByUuid(agentUUID)));
  //Model CreateMetric stub
  MetricStub.create = sandbox.stub();
  MetricStub.create.withArgs(newMetric).returns(
    Promise.resolve({
      toJSON() {
        return newMetric;
      }
    })
  );

  //Model findByTypeAgentUuid stub
  MetricStub.findByTypeAgentUuid = sandbox.stub();
  MetricStub.findByTypeAgentUuid
    .withArgs(typeAgentUuidArgs)
    .returns(
      Promise.resolve(metricFixtures.findByTypeAgentUuid(type, agentUUID))
    );

  //Modell findByAgentUuid stub
  MetricStub.findByAgentUuid = sandbox.stub();
  MetricStub.findByAgentUuid
    .withArgs(findByAgentUuidArgs)
    .returns(Promise.resolve(metricFixtures.findByAgentUuid(agentUUID)));

  // Model findAll Stub
  MetricStub.findAll = sandbox.stub();
  MetricStub.findAll.withArgs().returns(Promise.resolve(metricFixtures.all));
  MetricStub.findAll
    .withArgs(findByAgentUuidArgs)
    .returns(Promise.resolve(responseUuid));
  MetricStub.findAll
    .withArgs(typeAgentUuidArgs)
    .returns(Promise.resolve(typeAgentResponse));

  const setupDB = proxyquire("../", {
    "./models/agent": () => AgentStub,
    "./models/metric": () => MetricStub
  });
  db = await setupDB(config);
});

test.afterEach(() => {
  sinon.restore();
});

test.serial("Setup#Metric", t => {
  t.true(AgentStub.hasMany.called, "Should be called");
  t.true(MetricStub.belongsTo.called, "Should be called");
  t.true(AgentStub.hasMany.calledOnce, "Should be called once");
  t.true(MetricStub.belongsTo.calledOnce, "Should be called once");
  t.true(
    AgentStub.hasMany.calledWith(MetricStub),
    "Should be called with MetricModel"
  );
  t.true(
    MetricStub.belongsTo.calledWith(AgentStub),
    "Should be called with AgentModel"
  );
});

test("Metric", t => {
  t.truthy(db.Metric, "Metric service should exist");
});

test.serial("Metric#create -existing", async t => {
  let metric = await db.Metric.create(agentUUID, newMetric);
  t.true(AgentStub.findOne.called, "FindOne called");
  t.true(
    AgentStub.findOne.calledWith(uuidArgs),
    "FindOne called with specified args"
  );
  t.true(MetricStub.create.called, "Should be called");
  t.true(MetricStub.create.calledOnce, "Should be called once");
  t.true(
    MetricStub.create.calledWith(newMetric),
    "Should be called with new metric"
  );

  t.deepEqual(metric, newMetric, "Response and single should be the same");
});
test.serial("Metric#findByUuid", async t => {
  let metric = await db.Metric.findByAgentUuid(agentUUID);
  t.true(MetricStub.findAll.called, "findAll called");
  t.true(MetricStub.findAll.calledOnce, "findAll called Once");
  // t.true(MetricStub.findByAgentUuid.called, "FindbyAgentUuid should be called");
  // t.true(
  //   MetricStub.findByAgentUuid.calledOnce,
  //   "findByAgentUuid should be called Once"
  // );
  // t.true(
  //   MetricStub.findByAgentUuid.calledWith(agentUUID),
  //   "findByAgentUuid should be called with specified params"
  // );

  t.deepEqual(
    metric,
    metricFixtures.findByAgentUuid(agentUUID),
    "Should be the same."
  );
});

test.serial("Metric#FindByTypeAgentUuid", async t => {
  let metric = await db.Metric.findByTypeAgentUuid(type, agentUUID);
  t.true(MetricStub.findAll.called, "findAll called");
  t.true(MetricStub.findAll.calledOnce, "findAll called Once");

  t.deepEqual(metric, metricFixtures.findByTypeAgentUuid(type, agentUUID));
});
