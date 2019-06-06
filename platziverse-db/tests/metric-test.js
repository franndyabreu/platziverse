"use strict";

const test = require("ava");
const proxyquire = require("proxyquire");
const sinon = require("sinon");
const metricFixtures = require("./fixtures/metric");
const singleMetric = Object.assign({}, metricFixtures.single);
const type = "cpu";
let uuidArgs = singleMetric.uuid;

const responseUuid = metricFixtures.findByAgentUuid(metricFixtures.single.uuid);
const typeAgentResponse = metricFixtures.findByTypeAgentUuid(type, uuidArgs);

let sandbox = null;
let db = null;

let WhereArgs = { where: { uuidArgs } };

let AgentStub = {
  hasMany: sinon.spy(),
  findOne: sinon.spy()
};
const findByAgentUuidArgs = {
  attributes: ["type"],
  group: ["type"],
  include: [
    {
      attributes: [],
      model: AgentStub,
      where: {
        uuid: uuidArgs
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
        uuid: uuidArgs
      }
    }
  ],
  raw: true
};

let config = {
  logging: function() {}
};

let MetricStub = null;

const newMetric = {
  id: 1,
  type: "memory",
  value: "705",
  uuid: "xxx",
  createdAt: new Date(),
  updatedAt: new Date()
};

test.beforeEach(async () => {
  sandbox = sinon.createSandbox();
  MetricStub = {
    belongsTo: sinon.spy()
  };

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
      Promise.resolve(metricFixtures.findByTypeAgentUuid(type, uuidArgs))
    );

  //Modell findByAgentUuid stub
  MetricStub.findByAgentUuid = sandbox.stub();
  MetricStub.findByAgentUuid
    .withArgs(findByAgentUuidArgs)
    .returns(Promise.resolve(metricFixtures.findByAgentUuid(uuidArgs)));

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

test("Metric", t => {
  t.truthy(db.Metric, "Metric service should exist");
});

test.serial("Metric#create -existing", async t => {
  let metric = await db.Metric.create(uuidArgs, newMetric);
  t.true(AgentStub.findOne.called, "FindOne called");

  // t.true(
  //   AgentStub.findOne.calledWith(uuidArgs),
  //   "FindOne called with specified args"
  // );
});
test.serial("Metric#findByUuid", async t => {
  let metric = await db.Metric.findByAgentUuid(uuidArgs);
  t.true(MetricStub.findAll.called, "findAll called");
  t.true(MetricStub.findAll.calledOnce, "findAll called Once");
  // t.true(MetricStub.findByAgentUuid.called, "FindbyAgentUuid should be called");
  // t.true(
  //   MetricStub.findByAgentUuid.calledOnce,
  //   "findByAgentUuid should be called Once"
  // );
  // t.true(
  //   MetricStub.findByAgentUuid.calledWith(uuidArgs),
  //   "findByAgentUuid should be called with specified params"
  // );

  t.deepEqual(
    metric,
    metricFixtures.findByAgentUuid(uuidArgs),
    "Should be the same."
  );
  //   t.true(MetricStub.findByAgentUuid.called, "FindByAgentUuid should be called");
});

test.serial("Metric#FindByTypeAgentUuid", async t => {
  let metric = await db.Metric.findByTypeAgentUuid(type, uuidArgs);
  t.true(MetricStub.findAll.called, "findAll called");
  t.true(MetricStub.findAll.calledOnce, "findAll called Once");

  t.deepEqual(metric, metricFixtures.findByTypeAgentUuid(type, uuidArgs));
});