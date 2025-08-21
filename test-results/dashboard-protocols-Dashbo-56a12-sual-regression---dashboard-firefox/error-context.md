# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "Network Canvas" [ref=e4] [cursor=pointer]:
      - /url: /
      - img "Network Canvas" [ref=e5] [cursor=pointer]
    - main [ref=e6]:
      - generic [ref=e7]:
        - heading "Sign In To Fresco" [level=1] [ref=e8]
        - generic [ref=e9]:
          - generic [ref=e11]:
            - generic [ref=e12]: Username
            - textbox "Username" [ref=e14]: testuser@example.com
          - generic [ref=e16]:
            - generic [ref=e17]: Password
            - textbox "Password" [ref=e19]: TestPassword123!
          - generic [ref=e20]:
            - button "Signing in..." [disabled]:
              - img
              - text: Signing in...
  - region "Notifications (F8)":
    - list
  - alert [ref=e21]
```