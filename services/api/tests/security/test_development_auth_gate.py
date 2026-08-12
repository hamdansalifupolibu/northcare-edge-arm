from northcare_api.config import Settings


def test_development_auth_only_in_dev_test() -> None:
    assert Settings(NORTHCARE_ENV="development").development_auth_enabled is True
    assert Settings(NORTHCARE_ENV="test").development_auth_enabled is True
    assert Settings(NORTHCARE_ENV="staging").development_auth_enabled is False
    assert Settings(NORTHCARE_ENV="production").development_auth_enabled is False
