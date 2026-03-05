import { Heart, X } from 'lucide-react'
import type { DonateConfig } from '@/contexts/AuthContext'

interface DonateDialogProps {
  config: DonateConfig
  onClose: () => void
}

export default function DonateDialog({ config, onClose }: DonateDialogProps) {
  if (!config.enabled || !config.qrcodeImage) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 顶部渐变装饰 */}
        <div className="h-2 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500" />

        <div className="p-6 text-center space-y-5">
          {/* 图标 */}
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-pink-500/20">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center animate-bounce">
              <span className="text-[10px]">$</span>
            </div>
          </div>

          {/* 标题 */}
          <div>
            <h3 className="text-xl font-bold text-white">{config.title}</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{config.description}</p>
          </div>

          {/* 收款码 */}
          <div className="bg-white rounded-2xl p-3 inline-block shadow-lg">
            <img
              src={config.qrcodeImage}
              alt="微信收款码"
              className="w-48 h-48 object-contain"
            />
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18z"/>
            </svg>
            微信扫一扫，感谢您的支持
          </p>

          {/* 金额参考 */}
          {config.amounts && config.amounts.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-600">推荐金额</p>
              <div className="flex justify-center gap-2">
                {config.amounts.map((amount) => (
                  <div
                    key={amount}
                    className="px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-sm text-amber-400 font-medium"
                  >
                    ¥{amount}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
