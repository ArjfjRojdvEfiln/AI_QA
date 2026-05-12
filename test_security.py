# test_security.py
from app.core.security import get_password_hash, verify_password, create_access_token


def run_test():
    print("=== 开始测试安全模块 ===")

    # 测试 1: 密码加密
    plain_password = "my_super_password_123"
    print(f"\n[1] 原始密码: {plain_password}")

    hashed_pwd = get_password_hash(plain_password)
    print(f"[1] 加密后的哈希值: {hashed_pwd}")
    print(f"[1] 哈希值长度: {len(hashed_pwd)} 字符")

    # 测试 2: 密码校验
    print("\n[2] 开始校验密码...")
    is_correct = verify_password(plain_password, hashed_pwd)
    print(f"[2] 输入正确密码校验结果 (预期为 True): {is_correct}")

    is_wrong = verify_password("wrong_password_456", hashed_pwd)
    print(f"[2] 输入错误密码校验结果 (预期为 False): {is_wrong}")

    # 测试 3: JWT Token 生成
    test_username = "student_zhangsan"
    print(f"\n[3] 准备为用户 '{test_username}' 生成 JWT Token...")

    token = create_access_token(subject=test_username)
    print(f"[3] 生成的 Token 字符串:\n{token}")

    print("\n=== 测试完成 ===")


if __name__ == "__main__":
    run_test()