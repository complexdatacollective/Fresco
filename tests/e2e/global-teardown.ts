async function globalTeardown() {
  // eslint-disable-next-line no-console
  console.log('\n🧹 Running global teardown...');

  const testEnv = globalThis.__TEST_ENVIRONMENT__;
  if (testEnv) {
    await testEnv.cleanupAll();
  }

  // eslint-disable-next-line no-console
  console.log('✅ Teardown complete!\n');
}

export default globalTeardown;
