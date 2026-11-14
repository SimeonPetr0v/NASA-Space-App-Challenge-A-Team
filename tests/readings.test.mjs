import { registerHooks } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) {
      specifier = new URL('../src/' + specifier.slice(2) + '.ts', import.meta.url).href
    } else if (specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      specifier += '.ts'
    }
    return next(specifier, context)
  },
})

const { readingError } = await import('../src/engine/validate.ts')
const { saveReading, loadReadings, latestReadings, READINGS_KEY } = await import('../src/store/readings.ts')
const { assess, worstStatus } = await import('../src/engine/assess.ts')
const reading = (indicatorId = 'hr', value = 75) => ({
  indicatorId,
  value,
  takenAt: '2026-11-14T12:00:00Z',
  source: 'manual',
})

test('rejects invalid input without confusing it with danger', () => {
  for (const item of [
    reading('hr', NaN),
    reading('hr', Infinity),
    reading('mood', 2.5),
    reading('mood', 6),
    reading('sleep', 25),
    reading('spo2', 101),
    reading('bp', { systolic: 80, diastolic: 120 }),
    reading('bp', 120),
    { ...reading(), takenAt: 'bad' },
  ]) {
    assert.ok(readingError(item))
  }
  assert.equal(assess(reading('spo2', NaN)).status, 'no-data')
  assert.equal(assess(reading('bp', { systolic: NaN, diastolic: 80 })).status, 'no-data')
})

test('accepts valid endpoints and preserves clinical range checks', () => {
  for (const item of [
    reading('sleep', 0),
    reading('sleep', 24),
    reading('mood', 1),
    reading('mood', 5),
    reading('exercise', 0),
  ]) {
    assert.equal(readingError(item), null)
  }
  assert.equal(assess(reading('hr', 60)).status, 'normal')
  assert.equal(assess(reading('hr', 100)).status, 'normal')
  assert.equal(assess(reading('hr', 101)).status, 'caution')
  assert.equal(assess(reading('hr', 131)).status, 'danger')
  assert.equal(worstStatus([]), 'no-data')
})

test('round-trips history and selects latest by measurement time', () => {
  const map = new Map()
  const storage = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
  }
  assert.deepEqual(loadReadings(storage), [])
  const first = saveReading(storage, [], reading())
  const older = { ...reading('hr', 90), takenAt: '2026-11-13T12:00:00Z' }
  const all = saveReading(storage, first, older)
  assert.deepEqual(loadReadings(storage), all)
  assert.deepEqual(latestReadings(all), [reading()])
  assert.equal(first.length, 1)
  map.set(READINGS_KEY, '[{"bad":true}]')
  assert.throws(() => loadReadings(storage))
  map.set(READINGS_KEY, 'broken json')
  assert.throws(() => loadReadings(storage))
})

test('storage errors propagate without mutating existing history', () => {
  const original = [reading()]
  assert.throws(() => saveReading({ setItem() { throw Error('quota') } }, original, reading('sleep', 8)))
  assert.equal(original.length, 1)
})

const { scoreWellbeing, assessWellbeing, wellbeingError } = await import('../src/engine/wellbeing.ts')
const { loadWellbeing, saveWellbeing, WELLBEING_KEY } = await import('../src/store/wellbeing.ts')

test('validates WHO-5 answers and applies its scoring and follow-up cutoff', () => {
  for (const answers of [
    [],
    [5, 5, 5, 5],
    [5, 5, 5, 5, -1],
    [5, 5, 5, 5, 6],
    [1, 1, 1, 1, 0.5],
  ]) {
    assert.ok(wellbeingError(answers))
    assert.throws(() => scoreWellbeing(answers))
  }
  assert.deepEqual(scoreWellbeing([0, 0, 0, 0, 0]), {
    raw: 0,
    percent: 0,
    needsFollowup: true,
  })
  assert.deepEqual(scoreWellbeing([5, 5, 5, 5, 5]), {
    raw: 25,
    percent: 100,
    needsFollowup: false,
  })
  assert.equal(scoreWellbeing([3, 3, 2, 2, 2]).needsFollowup, true)
  assert.equal(scoreWellbeing([3, 3, 3, 2, 2]).needsFollowup, false)
  assert.equal(
    assessWellbeing({
      instrument: 'WHO-5',
      answers: [0, 0, 0, 0, 0],
      takenAt: '2026-11-14T12:00:00Z',
    }).status,
    'caution',
  )
})

test('stores WHO-5 answers separately and propagates storage failures', () => {
  const map = new Map()
  const storage = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
  }
  const check = {
    instrument: 'WHO-5',
    answers: [3, 3, 3, 3, 3],
    takenAt: '2026-11-14T12:00:00Z',
  }
  const saved = saveWellbeing(storage, [], check)
  assert.deepEqual(loadWellbeing(storage), saved)
  assert.equal(map.has(READINGS_KEY), false)
  assert.throws(() => saveWellbeing({ setItem() { throw Error('quota') } }, saved, check))
  map.set(WELLBEING_KEY, '[{"instrument":"WHO-5","answers":[5]}]')
  assert.throws(() => loadWellbeing(storage))
})

test('enforces input envelopes without treating a dangerous valid value as invalid', () => {
  for (const item of [
    reading('hr', 650),
    reading('hr', 600),
    reading('temp', 34),
    reading('temp', 42.2),
    reading('glu', 10),
    reading('glu', 600),
    reading('exercise', 300),
    reading('bp', { systolic: 260, diastolic: 215 }),
  ]) {
    assert.equal(readingError(item), null)
  }
  for (const item of [
    reading('hr', 651),
    reading('hr', 75.5),
    reading('temp', 33.9),
    reading('temp', 42.3),
    reading('glu', 601),
    reading('glu', 9),
    reading('exercise', 301),
    reading('exercise', 30.5),
    reading('bp', { systolic: 261, diastolic: 80 }),
    reading('bp', { systolic: 250, diastolic: 216 }),
  ]) {
    assert.ok(readingError(item))
  }
  assert.match(readingError(reading('exercise', 10000)), /0–300/)
  assert.equal(assess(reading('hr', 600)).status, 'danger')
  assert.equal(assess(reading('exercise', 0)).status, 'caution')
  assert.equal(assess(reading('exercise', 120)).status, 'normal')
  assert.equal(assess(reading('exercise', 150)).status, 'normal')
  assert.equal(assess(reading('exercise', 151)).status, 'caution')
})

test('keeps older stored readings when current entry limits tighten', () => {
  const old = [reading('hr', 900), reading('exercise', 1440), reading('mood', 2)]
  assert.deepEqual(loadReadings({ getItem: () => JSON.stringify(old) }), old)
})
